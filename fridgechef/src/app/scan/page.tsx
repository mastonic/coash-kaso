'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cache } from '@/lib/appCache';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RewardModal from '@/components/RewardModal';
import AdBanner from '@/components/AdBanner';
import DlcFallback from '@/components/DlcFallback';
import { useToast } from '@/components/Toast';
import { reportBug } from '@/lib/bugReport';

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, canScan, needsAd, dailyScanCount, rewardedScansCount, hasReachedLimit, refresh } = useSubscription(user);
  const { toast } = useToast();
  const [scanState, setScanState] = useState<'camera' | 'scanning' | 'success' | 'error'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'fridge' | 'placard' | 'receipt' | 'freezer'>('fridge');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [detectedItems, setDetectedItems] = useState<{name: string, x: number, y: number, id: number}[]>([]);
  const [particles, setParticles] = useState<{id: number, left: string, top: string, delay: string}[]>([]);
  const [pendingDlc, setPendingDlc] = useState<{ productName: string; category: string | null } | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Correction widget state
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctedIngredients, setCorrectedIngredients] = useState<string[]>([]);
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);
  const [correctionLoading, setCorrectionLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setParticles(Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`
    })));
  }, []);

  // Sync correctedIngredients with detected items when a new scan completes
  useEffect(() => {
    if (detectedItems.length > 0) {
      setCorrectedIngredients(detectedItems.map(item => item.name));
      setCorrectionOpen(false);
      setCorrectionSubmitted(false);
    }
  }, [detectedItems]);

  useEffect(() => {
    async function setupCamera() {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1920 } }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err: any) {
        const msg = err?.name === 'NotAllowedError'
          ? 'Permission caméra refusée. Autorise l\'accès dans les réglages de ton navigateur.'
          : err?.name === 'NotFoundError'
          ? 'Aucune caméra détectée sur cet appareil.'
          : 'Impossible d\'accéder à la caméra. Utilise la galerie pour importer une photo.';
        setCameraError(msg);
        setScanState('error');
        reportBug(user?.uid, { page: '/scan', action: 'setupCamera', errorName: err?.name, errorMessage: err?.message });
      }
    }
    if (!authLoading) setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
      }
    };
  }, [authLoading]);

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    if (!canScan) {
      if (needsAd) {
        setShowRewardModal(true);
        return;
      }
      if (hasReachedLimit) {
        toast("Limite quotidienne atteinte (1 gratuit + 2 pubs). Passez au plan Passion pour de l'illimité !", 'warning');
        return;
      }
      return;
    }

    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      toast("Caméra en cours de démarrage, réessaie dans un instant.", 'warning');
      return;
    }

    setScanState('scanning');

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);

    if (scanMode === 'receipt') {
      const base64Img = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(base64Img);
      canvas.toBlob(async (blob) => {
        if (!blob) { setScanState('camera'); return; }
        const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        await handleReceiptUpload(fakeEvent);
      }, 'image/jpeg', 0.8);
    } else {
      const base64Img = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(base64Img);
      processScan(base64Img, scanMode);
    }
  };

  const processScan = async (base64Img: string, mode: 'fridge' | 'placard' | 'receipt' | 'freezer' = 'fridge') => {
    try {
      const token = user ? await user.getIdToken() : null;
      const apiRes = await fetch('/api/scan-fridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image: base64Img, scanType: mode }),
      });
      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => ({}));
        throw new Error(errData.error || `API error ${apiRes.status}`);
      }
      const data = await apiRes.json();

      const newItems: string[] = data.ingredients || [];
      if (newItems.length === 0) throw new Error('No ingredients found');

      const labels = newItems.map((name, i) => ({
        name,
        x: 20 + Math.random() * 60,
        y: 30 + Math.random() * 40,
        id: Date.now() + i
      }));
      setDetectedItems(labels);

      if (data.scanId) setCurrentScanId(data.scanId);

      if (user) cache.invalidateScans(user.uid);

      setTimeout(() => {
        const dlc = data.dlcInfo;
        if (dlc?.found && !dlc?.date) {
          setPendingDlc({ productName: dlc.productName || 'Produit', category: dlc.category || null });
        } else {
          setScanState('success');
        }
      }, 2500);

    } catch (err: any) {
      const errMsg = err?.message || '';
      const msg = errMsg.includes('Quota') || errMsg.includes('quota')
        ? "Scan du jour épuisé. Regarde une pub ou passe en Premium !"
        : errMsg.includes('401') || errMsg.includes('authentification')
        ? "Problème de connexion. Reconnecte-toi et réessaie."
        : errMsg.includes('No ingredients')
        ? "Aucun aliment détecté. Améliore l'éclairage et réessaie."
        : "Scan échoué. Vérifiez l'éclairage et réessayez.";
      toast(msg, 'error');
      setScanState('camera');
      reportBug(user?.uid, { page: '/scan', action: 'processScan', errorName: err?.name, errorMessage: err?.message });
    }
  };

  const handleSubmitCorrection = async () => {
    setCorrectionLoading(true);
    try {
      const token = user ? await user.getIdToken() : null;
      await fetch('/api/scan-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scanId: currentScanId,
          scanType: scanMode,
          originalIngredients: detectedItems.map(item => item.name),
          correctedIngredients: correctedIngredients.filter(Boolean),
        }),
      });
      setCorrectionSubmitted(true);
      toast('Correction envoyée. Merci !', 'success');
    } catch (err) {
      console.error('Correction error:', err);
      toast("Erreur lors de l'envoi", 'error');
    } finally {
      setCorrectionLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = ev.target?.result as string;
        setCapturedImage(img);
        setScanState('scanning');
        processScan(img, scanMode);
      };
      reader.readAsDataURL(file);
    }
  };

  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canScan) {
      if (needsAd) { setShowRewardModal(true); return; }
      if (hasReachedLimit) {
        toast("Limite quotidienne atteinte. Passez au plan Passion pour de l'illimité !", 'warning');
        return;
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
      setScanState('scanning');
    };
    reader.readAsDataURL(file);
    try {
      const token = user ? await user.getIdToken() : null;
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const newItems: string[] = data.ingredients || [];
      if (newItems.length === 0) throw new Error('Aucun ingrédient trouvé');

      const labels = newItems.map((name, i) => ({
        name, x: 20 + Math.random() * 60, y: 30 + Math.random() * 40, id: Date.now() + i
      }));
      setDetectedItems(labels);

      await addDoc(collection(db, 'scans'), {
        userId: user?.uid,
        ingredients: newItems,
        timestamp: serverTimestamp(),
        origin: 'receipt',
      });
      if (user) cache.invalidateScans(user.uid);

      setTimeout(() => setScanState('success'), 2500);
    } catch (err) {
      void err;
      toast("Impossible de lire le ticket. Vérifiez la qualité de la photo.", 'error');
      setScanState('camera');
    }
  };

  const handleDlcValidated = async (dlcDate: string, dlcCategory: string) => {
    if (currentScanId) {
      try {
        await updateDoc(doc(db, 'scans', currentScanId), {
          'dlc.date': dlcDate,
          'dlc.category': dlcCategory,
          'dlc.found': true,
        });
      } catch {
        // non-bloquant
      }
    }
    setPendingDlc(null);
    setScanState('success');
  };

  if (authLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden italic selection:bg-primary/30">

      {/* Beta banner — désactivé en prod via NEXT_PUBLIC_BETA_MODE */}
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && (
        <div className="absolute top-0 left-0 right-0 z-[60] bg-primary/10 border-b border-primary/20 backdrop-blur-xl px-4 py-2 flex items-center justify-center gap-2 pointer-events-none">
          <span className="text-primary text-[9px] font-black uppercase tracking-[0.2em]">🧪 Mode bêta</span>
          <span className="text-white/40 text-[9px]">—</span>
          <span className="text-white/50 text-[9px]">Tes corrections entraînent l'IA · Plus tu corriges, plus elle devient précise pour tout le monde</span>
        </div>
      )}

      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none"
        style={{ paddingTop: process.env.NEXT_PUBLIC_BETA_MODE === 'true' ? '2.5rem' : undefined }}
      >
         <Link href="/dashboard" className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-all">
            <span className="material-symbols-outlined text-white">arrow_back</span>
         </Link>

         <div className="flex flex-col items-center gap-2">
            <div className="bg-black/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 flex items-center gap-2 pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">IA Active</span>
            </div>
            {!isPremium && (
               <div className="bg-black/60 backdrop-blur-xl px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Quota: {dailyScanCount}/3 scans</span>
               </div>
            )}
         </div>

         <div className="w-12 h-12"></div>
      </div>

      {showRewardModal && (
        <RewardModal
          user={user}
          count={rewardedScansCount}
          onSuccess={() => {
            setShowRewardModal(false);
            refresh();
          }}
          onClose={() => setShowRewardModal(false)}
        />
      )}

      {/* Main Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Photo scannée"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* AR 3D LABELS */}
        {scanState === 'scanning' && detectedItems.map((item) => (
            <div
                key={item.id}
                className="absolute z-50 bg-primary/20 backdrop-blur-xl border border-primary/40 px-4 py-2 rounded-2xl shadow-glow-primary animate-ar-float"
                style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `translate(-50%, -50%) perspective(1000px) rotateY(${Math.sin(item.id) * 20}deg)`
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[12px] text-primary animate-pulse">check_circle</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white italic">{item.name}</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-t from-transparent to-primary/40"></div>
            </div>
        ))}

        {/* SCAN PARTICLES */}
        {scanState === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none z-20">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute w-1 h-1 bg-primary rounded-full animate-particle opacity-0"
                        style={{ left: p.left, top: p.top, animationDelay: p.delay }}
                    ></div>
                ))}
            </div>
        )}

        {/* Visual Target HUD */}
        <div className={`relative z-10 w-[85vw] max-w-lg h-[60vh] max-h-[500px] border-2 border-white/20 rounded-[3rem] transition-all duration-700 ${scanState === 'scanning' ? 'scale-105 border-primary/40 shadow-[0_0_150px_rgba(107,254,156,0.3)]' : 'shadow-[0_0_100px_rgba(0,0,0,0.5)]'} flex items-center justify-center`}>
            <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl"></div>
            <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl"></div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl"></div>

            <div className={`text-center space-y-2 transition-opacity duration-500 ${scanState === 'scanning' ? 'opacity-0' : 'opacity-40'}`}>
                <span className="material-symbols-outlined text-6xl">
                  {scanMode === 'receipt' ? 'receipt_long' : scanMode === 'placard' ? 'shelves' : scanMode === 'freezer' ? 'ac_unit' : 'center_focus_strong'}
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {scanMode === 'receipt' ? 'Viser votre ticket ici' : scanMode === 'placard' ? 'Viser votre placard ici' : scanMode === 'freezer' ? 'Viser votre congélateur ici' : 'Viser votre frigo ici'}
                </p>
            </div>

            {scanState === 'scanning' && (
                <div className="absolute inset-x-8 bg-primary/60 h-0.5 shadow-glow-primary animate-scan-line-v2"></div>
            )}
        </div>

        {/* Status Messaging Overlay */}
        <div className="absolute top-1/4 z-40 w-full px-10 text-center">
            {scanState === 'scanning' && (
                <div className="inline-flex flex-col items-center gap-4">
                    <div className="bg-primary text-black px-8 py-3 rounded-full font-black uppercase italic text-xs shadow-glow-primary animate-bounce">
                        Analyse Géo-Spatiale...
                    </div>
                </div>
            )}
            {scanState === 'error' && (
                <div className="bg-[#111]/95 backdrop-blur-xl px-6 py-5 rounded-3xl border border-red-500/20 text-center space-y-3 mx-4">
                    <span className="material-symbols-outlined text-red-400 text-3xl">no_photography</span>
                    <p className="text-xs font-black uppercase tracking-widest text-red-400">Caméra inaccessible</p>
                    <p className="text-white/60 text-[11px] leading-relaxed">{cameraError || 'Impossible d\'accéder à la caméra.'}</p>
                    <div className="flex gap-2 justify-center pt-1">
                      <button onClick={() => window.location.reload()} className="bg-white/10 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase border border-white/10">
                        Réessayer
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-black px-4 py-2 rounded-full text-[10px] font-black uppercase">
                        Utiliser la galerie
                      </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Bottom Interface */}
      <div className="relative z-50 bg-gradient-to-t from-black to-transparent pt-6 pb-8 px-10 flex flex-col items-center gap-4 pointer-events-none">

        {!isPremium && scanState === 'camera' && (
          <AdBanner className="w-full pointer-events-auto mb-1 px-2" format="horizontal" />
        )}

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 pointer-events-auto">
          <button
            onClick={() => setScanMode('fridge')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'fridge' ? 'bg-primary text-black' : 'text-white/40 hover:text-white/70'}`}
          >
            <span className="material-symbols-outlined text-sm">kitchen</span>
            Frigo
          </button>
          <button
            onClick={() => setScanMode('placard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'placard' ? 'bg-orange-400 text-black' : 'text-white/40 hover:text-white/70'}`}
          >
            <span className="material-symbols-outlined text-sm">shelves</span>
            Placard
          </button>
          <button
            onClick={() => setScanMode('receipt')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'receipt' ? 'bg-yellow-400 text-black' : 'text-white/40 hover:text-white/70'}`}
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            Ticket
          </button>
          <button
            onClick={() => setScanMode('freezer')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'freezer' ? 'bg-blue-400 text-black' : 'text-white/40 hover:text-white/70'}`}
          >
            <span className="material-symbols-outlined text-sm">ac_unit</span>
            Congélo
          </button>
        </div>

        <div className="flex items-center justify-between w-full">
          {/* Gallery */}
          <div className="w-16 h-16 pointer-events-auto">
              <input type="file" ref={fileInputRef} onChange={scanMode === 'receipt' ? handleReceiptUpload : handleFileUpload} accept="image/*" className="hidden" />
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-white/20"
              >
                  <span className="material-symbols-outlined text-white">image</span>
              </button>
          </div>

          {/* Shutter */}
          <button
              disabled={scanState === 'scanning'}
              onClick={capturePhoto}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl pointer-events-auto active:scale-95 transition-all relative group"
          >
              <div className="absolute inset-2 border-4 border-black/5 rounded-full"></div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner ${scanMode === 'receipt' ? 'bg-yellow-400' : scanMode === 'placard' ? 'bg-orange-400' : scanMode === 'freezer' ? 'bg-blue-400' : 'bg-primary'}`}>
                  <span className="material-symbols-outlined text-4xl text-black font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {scanMode === 'receipt' ? 'receipt_long' : scanMode === 'placard' ? 'shelves' : scanMode === 'freezer' ? 'ac_unit' : 'photo_camera'}
                  </span>
              </div>
              {scanState === 'scanning' && (
                  <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20"></div>
              )}
          </button>

          <div className="w-16 h-16 pointer-events-auto">
            <input type="file" ref={receiptInputRef} onChange={handleReceiptUpload} accept="image/*" className="hidden" />
            <div className="w-full h-full" />
          </div>
        </div>

      </div>

      {pendingDlc && (
        <DlcFallback
          productName={pendingDlc.productName}
          onDlcValidated={handleDlcValidated}
          onSkip={() => { setPendingDlc(null); setScanState('success'); }}
        />
      )}

      {scanState === 'success' && (
        <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 overflow-y-auto">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-glow-primary scale-110 shrink-0">
                <span className="material-symbols-outlined text-5xl text-black font-black">check_circle</span>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Scan Réussi !</h2>
            <p className="text-on-surface-variant font-medium text-sm mb-6">{detectedItems.length} ingrédient{detectedItems.length > 1 ? 's' : ''} identifié{detectedItems.length > 1 ? 's' : ''} et ajouté{detectedItems.length > 1 ? 's' : ''} à votre frigo.</p>

            {/* Correction widget — améliore l'IA à chaque retour */}
            <div className="w-full max-w-sm mb-6">
              {!correctionSubmitted ? (
                <>
                  <button
                    onClick={() => setCorrectionOpen(o => !o)}
                    className="w-full py-3 text-white font-black text-xs uppercase tracking-widest border-2 border-white/30 rounded-xl hover:border-white/60 hover:bg-white/5 transition-all"
                    aria-expanded={correctionOpen}
                  >
                    {correctionOpen ? '▲ Fermer la correction' : '✏️ Certains ingrédients sont incorrects ?'}
                  </button>

                  {correctionOpen && (
                    <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-left">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">
                        Corrigez la liste — l'IA apprendra
                      </p>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {correctedIngredients.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={e =>
                                setCorrectedIngredients(prev =>
                                  prev.map((c, i) => (i === idx ? e.target.value : c))
                                )
                              }
                              className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:border-primary outline-none"
                            />
                            <button
                              onClick={() =>
                                setCorrectedIngredients(prev => prev.filter((_, i) => i !== idx))
                              }
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-all shrink-0"
                              aria-label="Supprimer cet ingrédient"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setCorrectedIngredients(prev => [...prev, ''])}
                        className="text-primary text-xs hover:underline"
                      >
                        + Ajouter un ingrédient manquant
                      </button>

                      <button
                        onClick={handleSubmitCorrection}
                        disabled={correctionLoading}
                        className="w-full py-2.5 bg-primary/10 border border-primary text-primary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {correctionLoading ? 'Envoi...' : '🧠 Envoyer la correction à l\'IA'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-3 text-center bg-primary/10 rounded-xl border border-primary/30 space-y-0.5 px-4">
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest">✓ Correction reçue</p>
                  <p className="text-white/40 text-[9px]">Tu viens d'améliorer l'IA FridgeChef pour tous les utilisateurs 🙌</p>
                </div>
              )}
            </div>

            <div className="w-full space-y-4 max-w-sm">
                <button onClick={() => router.push('/recipes')} className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs italic shadow-glow-primary active:scale-95 transition-all">
                    Voir les recettes
                </button>
                <button
                  onClick={() => {
                    setScanState('camera');
                    setDetectedItems([]);
                    setCapturedImage(null);
                    setCorrectionOpen(false);
                    setCorrectedIngredients([]);
                    setCorrectionSubmitted(false);
                  }}
                  className="w-full bg-surface-container-highest text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs italic active:scale-95 transition-all border border-white/5"
                >
                    Scanner Autre Chose
                </button>
            </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line-v2 {
            0% { transform: translateY(-240px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(240px); opacity: 0; }
        }
        @keyframes scan-line {
            0% { transform: translateY(-120px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(120px); opacity: 0; }
        }
        @keyframes ar-float {
            0% { transform: translate(-50%, -50%) scale(0.8) translateY(10px); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.1) translateY(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1) translateY(-5px); opacity: 1; }
        }
        @keyframes particle {
            0% { transform: scale(0); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: scale(2) translateY(-20px); opacity: 0; }
        }
        .animate-scan-line { animation: scan-line 1.5s infinite ease-in-out; }
        .animate-scan-line-v2 { animation: scan-line-v2 1.8s infinite ease-in-out; }
        .animate-ar-float { animation: ar-float 0.8s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-particle { animation: particle 2s infinite ease-out; }
        .shadow-glow-primary { filter: drop-shadow(0 0 15px rgba(107,254,156,0.6)); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
