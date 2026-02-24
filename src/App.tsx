import React, { useState, useRef, useEffect } from 'react';
import { usePersistentState } from './hooks/usePersistentState';
import { 
  Home, 
  Map as MapIcon, 
  History, 
  User, 
  Camera, 
  Truck, 
  Store, 
  Gift, 
  Trophy, 
  ChevronRight, 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  Info,
  Wallet,
  ArrowUpRight,
  LogOut,
  Bell,
  HelpCircle,
  Package,
  Flashlight,
  Image as ImageIcon,
  MapPin,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { identifyWaste, type WasteIdentification } from './services/geminiService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Screen = 'home' | 'map' | 'scan' | 'history' | 'profile' | 'market' | 'result';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [points, setPoints] = usePersistentState<number>('eco-points', 1250);
  const [walletBalance] = usePersistentState<number>('eco-wallet-balance', 25000);
  const [identificationResult, setIdentificationResult] = useState<WasteIdentification | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScan = async (image: string) => {
    setIsScanning(true);
    setScanError(null);
    setCapturedImage(image);

    const result = await identifyWaste(image);
    setIsScanning(false);

    if (result) {
      setIdentificationResult(result);
      setActiveScreen('result');
      return;
    }

    setScanError('Gagal mengidentifikasi sampah. Coba ambil foto ulang dengan pencahayaan lebih baik.');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen onNavigate={setActiveScreen} points={points} />;
      case 'map':
        return <MapScreen onBack={() => setActiveScreen('home')} />;
      case 'scan':
        return <ScanScreen onBack={() => setActiveScreen('home')} onCapture={handleScan} isScanning={isScanning} scanError={scanError} />;
      case 'result':
        return (
          <ResultScreen 
            result={identificationResult} 
            image={capturedImage} 
            onBack={() => setActiveScreen('home')} 
            onFindLocation={() => setActiveScreen('map')}
            onConfirm={() => {
              if (identificationResult) setPoints(p => p + identificationResult.points);
              setActiveScreen('home');
            }}
          />
        );
      case 'market':
        return <MarketScreen onBack={() => setActiveScreen('home')} balance={walletBalance} />;
      case 'profile':
        return <ProfileScreen onBack={() => setActiveScreen('home')} points={points} />;
      case 'history':
        return <HistoryScreen onBack={() => setActiveScreen('home')} />;
      default:
        return <HomeScreen onNavigate={setActiveScreen} points={points} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#f6f8f6] overflow-hidden relative font-sans">
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {activeScreen !== 'scan' && activeScreen !== 'result' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 flex justify-between items-center bottom-nav-shadow z-50">
          <NavButton 
            active={activeScreen === 'home'} 
            onClick={() => setActiveScreen('home')} 
            icon={<Home size={24} />} 
            label="Home" 
          />
          <NavButton 
            active={activeScreen === 'map'} 
            onClick={() => setActiveScreen('map')} 
            icon={<MapIcon size={24} />} 
            label="Peta" 
          />
          
          <div className="relative -top-8">
            <button 
              onClick={() => setActiveScreen('scan')}
              className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 active:scale-95 transition-transform"
            >
              <Camera size={32} />
            </button>
          </div>

          <NavButton 
            active={activeScreen === 'history'} 
            onClick={() => setActiveScreen('history')} 
            icon={<History size={24} />} 
            label="Riwayat" 
          />
          <NavButton 
            active={activeScreen === 'profile'} 
            onClick={() => setActiveScreen('profile')} 
            icon={<User size={24} />} 
            label="Akun" 
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-primary" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

// --- Screens ---

function HomeScreen({ onNavigate, points }: { onNavigate: (s: Screen) => void, points: number }) {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-4 bg-white rounded-full rotate-45" />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight">EcoLoka</span>
        </div>
        <div className="bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
          <Trophy size={16} className="text-primary fill-primary" />
          <span className="text-sm font-bold text-slate-800">{points.toLocaleString()} pts</span>
        </div>
      </div>

      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900">Selamat Datang, Budi! 👋</h1>
        <p className="text-slate-500 font-medium">Siap menjadi pahlawan lingkungan hari ini?</p>
      </div>

      {/* Main Scan Button */}
      <button 
        onClick={() => onNavigate('scan')}
        className="w-full py-6 bg-primary rounded-3xl flex items-center justify-center gap-3 text-white shadow-xl shadow-primary/30 active:scale-[0.98] transition-all group"
      >
        <Camera size={28} className="group-hover:scale-110 transition-transform" />
        <span className="text-xl font-black tracking-wider">SCAN SAMPAH</span>
      </button>

      {/* Services Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Layanan Utama</h2>
        <div className="grid grid-cols-2 gap-4">
          <ServiceCard 
            icon={<Truck className="text-blue-500" />} 
            title="JEMPUT SAMPAH" 
            desc="Penjadwalan pickup" 
            bgColor="bg-blue-50"
            onClick={() => {}}
          />
          <ServiceCard 
            icon={<Store className="text-orange-500" />} 
            title="PASAR DAUR ULANG" 
            desc="Beli produk ramah lingkungan" 
            bgColor="bg-orange-50"
            onClick={() => onNavigate('market')}
          />
          <ServiceCard 
            icon={<Gift className="text-purple-500" />} 
            title="DONASI BARANG" 
            desc="Bantu mereka yang butuh" 
            bgColor="bg-purple-50"
            onClick={() => {}}
          />
          <ServiceCard 
            icon={<Zap className="text-emerald-500" />} 
            title="TANTANGAN HIJAU" 
            desc="Belajar & dapatkan poin" 
            bgColor="bg-emerald-50"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Weekly Mission */}
      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Misi Mingguan</h3>
          <span className="text-primary font-bold">75%</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '75%' }}
            className="h-full bg-primary"
          />
        </div>
        <p className="text-sm text-slate-500 font-medium">Daur ulang 2kg lagi untuk bonus 500 pts!</p>
      </div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, bgColor, onClick }: { icon: React.ReactNode, title: string, desc: string, bgColor: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start gap-4 text-left active:scale-95 transition-all"
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bgColor)}>
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-xs font-black text-slate-800 leading-tight">{title}</h3>
        <p className="text-[10px] text-slate-400 font-medium leading-tight">{desc}</p>
      </div>
    </button>
  );
}

function ScanScreen({ onBack, onCapture, isScanning, scanError }: { onBack: () => void, onCapture: (img: string) => void, isScanning: boolean, scanError: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    }
    setupCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="h-full bg-black relative flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <button aria-label="Kembali" onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-white font-bold">Scan Sampah</h2>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {hasPermission === false ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <Info size={48} className="text-white/50" />
            <p className="text-white font-medium">Izin kamera diperlukan untuk memindai sampah.</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                
                {/* Scanning Line */}
                <motion.div 
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_15px_rgba(19,236,37,0.8)]"
                />
              </div>
            </div>

            <div className="absolute bottom-32 left-0 right-0 flex justify-center">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <p className="text-white text-xs font-bold tracking-widest uppercase">ARAHKAN KAMERA KE SAMPAH</p>
              </div>
            </div>

            {scanError && (
              <div className="absolute bottom-16 left-6 right-6 bg-red-500/90 text-white px-4 py-3 rounded-2xl text-xs font-semibold">
                {scanError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white h-48 rounded-t-[40px] flex flex-col items-center justify-center gap-6 px-10">
        <div className="flex items-center justify-between w-full">
          <button aria-label="Pilih gambar dari galeri" className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <ImageIcon size={24} />
          </button>
          
          <button 
            onClick={capture}
            disabled={isScanning}
            className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40 active:scale-90 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera size={36} />
            )}
          </button>

          <button aria-label="Nyalakan senter" className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <Flashlight size={24} />
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="w-6 h-1 bg-primary rounded-full" />
          <div className="w-2 h-1 bg-slate-200 rounded-full" />
          <div className="w-2 h-1 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ result, image, onBack, onFindLocation, onConfirm }: { result: WasteIdentification | null, image: string | null, onBack: () => void, onFindLocation: () => void, onConfirm: () => void }) {
  if (!result) return null;

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <button aria-label="Kembali" onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Hasil Identifikasi</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Image Preview */}
        <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] shadow-lg">
          <img src={image || ''} alt="Captured waste" className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-primary px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-white tracking-widest uppercase">TERDETEKSI</span>
          </div>
        </div>

        {/* Identification Info */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">
            Jenis: <span className="text-primary">{result.type} ({result.material})</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            {result.description}
          </p>
        </div>

        {/* Sorting Steps */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-primary rounded-full" />
            </div>
            <h3 className="font-bold text-slate-800">Cara Memilah</h3>
          </div>

          <div className="space-y-8 relative pl-4">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
            {result.sortingSteps.map((step, idx) => (
              <div key={idx} className="flex gap-6 relative">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center z-10 border-2 border-white">
                  <CheckCircle2 size={14} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-sm">{step.split(':')[0]}</p>
                  {step.includes(':') && (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.split(':')[1]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
            <Info size={20} className="text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-primary tracking-widest uppercase">DAMPAK LINGKUNGAN</h4>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {result.environmentalImpact}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-white border-t border-slate-50 space-y-3">
        <button 
          onClick={onFindLocation}
          className="w-full py-4 bg-primary rounded-2xl flex items-center justify-center gap-2 text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <MapPin size={20} />
          <span>CARI TITIK SETOR TERDEKAT</span>
        </button>
        <button 
          onClick={onConfirm}
          className="w-full py-4 bg-slate-100 rounded-2xl text-slate-600 font-bold active:scale-95 transition-all"
        >
          SELESAI
        </button>
      </div>
    </div>
  );
}

function MapScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'setor' | 'jemput'>('setor');

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">EcoLoka</h2>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="px-6 pb-4">
        <div className="bg-slate-100 p-1 rounded-2xl flex">
          <button 
            onClick={() => setActiveTab('setor')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'setor' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            )}
          >
            Titik Setor
          </button>
          <button 
            onClick={() => setActiveTab('jemput')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'jemput' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            )}
          >
            Jadwalkan Jemputan
          </button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="flex-1 relative bg-slate-200 overflow-hidden">
        <img 
          src="https://picsum.photos/seed/map/800/1200" 
          alt="Map placeholder" 
          className="w-full h-full object-cover opacity-50 grayscale" 
        />
        <div className="absolute inset-0 bg-blue-500/10" />
        
        {/* Map Markers */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
              <MapPin size={20} />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-sm" />
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/4">
          <div className="w-8 h-8 bg-primary/80 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
            <MapPin size={16} />
          </div>
        </div>

        <div className="absolute top-2/3 right-1/4">
          <div className="w-8 h-8 bg-primary/80 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
            <MapPin size={16} />
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-6 right-6 space-y-3">
          <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-slate-600">
            <Search size={24} />
          </button>
          <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-slate-600">
            <Zap size={24} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="p-6 space-y-6 bg-white rounded-t-[40px] -mt-10 relative z-10 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Bank Sampah Terdekat</h3>
          <button className="text-primary font-bold text-sm">Lihat Semua</button>
        </div>

        <div className="space-y-4">
          <LocationItem 
            icon={<Zap className="text-primary" />} 
            name="Bank Sampah Melati" 
            address="Jl. Melati No. 12" 
            status="Buka" 
            dist="1.2 km" 
          />
          <LocationItem 
            icon={<Truck className="text-blue-500" />} 
            name="Pengepul Pak Budi" 
            address="Gg. Swadaya III" 
            status="Buka" 
            dist="2.5 km" 
          />
          <LocationItem 
            icon={<Home className="text-slate-400" />} 
            name="Bank Sampah Hijau" 
            address="Kawasan Industri Pulogadung" 
            status="Tutup" 
            dist="3.1 km" 
            isClosed
          />
        </div>
      </div>
    </div>
  );
}

function LocationItem({ icon, name, address, status, dist, isClosed }: { icon: React.ReactNode, name: string, address: string, status: string, dist: string, isClosed?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="flex-1 space-y-0.5">
        <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
        <p className="text-[10px] text-slate-400 font-medium">
          {address} • <span className={isClosed ? "text-red-400" : "text-primary"}>{status}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="font-black text-slate-800 text-sm">{dist}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JARAK</p>
      </div>
    </div>
  );
}

function MarketScreen({ onBack, balance }: { onBack: () => void, balance: number }) {
  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Pasar Daur Ulang</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Wallet Card */}
        <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Wallet size={24} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SALDO ANDA SAAT INI</p>
              <p className="text-lg font-black text-slate-800">Dompet EcoLoka: Rp {balance.toLocaleString()}</p>
            </div>
          </div>
          <button className="w-full py-4 bg-primary rounded-2xl text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
            Tarik Dana
          </button>
        </div>

        <button className="w-full py-6 bg-slate-900 rounded-3xl flex items-center justify-center gap-3 text-white shadow-xl active:scale-[0.98] transition-all">
          <History size={24} className="text-primary" />
          <span className="text-lg font-black tracking-wider uppercase">JUAL SAMPAH SAYA</span>
        </button>

        {/* Prices */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Harga Sampah Hari Ini</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase">UPDATE: 23 FEB</span>
          </div>
          
          <div className="space-y-3">
            <PriceItem icon="📦" name="Kardus" price="1.500" />
            <PriceItem icon="💧" name="Botol Plastik" price="2.000" />
            <PriceItem icon="🥫" name="Kaleng" price="9.000" />
            <PriceItem icon="🍷" name="Kaca" price="500" />
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Riwayat Transaksi</h3>
          <div className="space-y-3">
            <TransactionItem type="plus" title="Penjualan Plastik" date="10 Okt 2023 • 2.5 kg" amount="+Rp 5.000" />
            <TransactionItem type="plus" title="Penjualan Kardus" date="08 Okt 2023 • 5.0 kg" amount="+Rp 7.500" />
            <TransactionItem type="minus" title="Penarikan Dana" date="05 Okt 2023" amount="-Rp 50.000" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceItem({ icon, name, price }: { icon: string, name: string, price: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-bold text-slate-800">{name}</span>
      </div>
      <p className="text-slate-800 font-black">
        <span className="text-primary">Rp {price}</span>
        <span className="text-slate-400 text-xs font-medium">/kg</span>
      </p>
    </div>
  );
}

function TransactionItem({ type, title, date, amount }: { type: 'plus' | 'minus', title: string, date: string, amount: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          type === 'plus' ? "bg-primary/10 text-primary" : "bg-red-50 text-red-400"
        )}>
          {type === 'plus' ? <ArrowUpRight size={20} /> : <ArrowLeft size={20} className="rotate-[-45deg]" />}
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className="text-[10px] text-slate-400 font-medium">{date}</p>
        </div>
      </div>
      <p className={cn("font-black text-sm", type === 'plus' ? "text-primary" : "text-red-400")}>
        {amount}
      </p>
    </div>
  );
}

function ProfileScreen({ onBack, points }: { onBack: () => void, points: number }) {
  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Profil Saya</h2>
        <button className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <Bell size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Profile Info */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 overflow-hidden">
              <img src="https://picsum.photos/seed/user/200/200" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white">
              <Camera size={16} />
            </button>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-slate-900">Aditya Pratama</h1>
            <div className="flex items-center justify-center gap-1.5 text-primary">
              <Trophy size={16} />
              <span className="text-sm font-bold">Pahlawan Lingkungan Level 5</span>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[32px] p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SALDO POIN</p>
              <p className="text-2xl font-black text-slate-900">{points.toLocaleString()} <span className="text-primary text-sm">Poin</span></p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Zap size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Gunakan poin Anda untuk menukar hadiah menarik atau donasi bibit pohon.
          </p>
          <button className="w-full py-4 bg-primary rounded-2xl text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Gift size={20} />
            <span>Tukar Poin Sekarang</span>
          </button>
        </div>

        {/* Menu */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">MENU UTAMA</h3>
          <div className="bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden">
            <MenuItem icon={<History className="text-primary" />} label="Riwayat Transaksi" />
            <MenuItem icon={<Package className="text-primary" />} label="Barang Donasi Saya" />
            <MenuItem icon={<Bell className="text-primary" />} label="Pengaturan Notifikasi" />
            <MenuItem icon={<HelpCircle className="text-primary" />} label="Pusat Bantuan" />
            <MenuItem icon={<LogOut className="text-red-400" />} label="Keluar Akun" isLast />
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, isLast }: { icon: React.ReactNode, label: string, isLast?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between p-5 active:bg-slate-100 transition-colors",
      !isLast && "border-b border-slate-100"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className="font-bold text-slate-800">{label}</span>
      </div>
      <ChevronRight size={20} className="text-slate-300" />
    </button>
  );
}

function HistoryScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Riwayat Aktivitas</h2>
        <div className="w-10" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hari Ini</h3>
          <HistoryItem icon="♻️" title="Daur Ulang Botol Plastik" desc="2.5 kg • Bank Sampah Melati" points="+150 pts" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Kemarin</h3>
          <HistoryItem icon="📦" title="Daur Ulang Kardus" desc="5.0 kg • Pengepul Pak Budi" points="+300 pts" />
          <HistoryItem icon="🎁" title="Donasi Pakaian" desc="3 item • Panti Asuhan Kasih" points="+50 pts" />
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ icon, title, desc, points }: { icon: string, title: string, desc: string, points: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
        </div>
      </div>
      <p className="font-black text-primary text-sm">
        {points}
      </p>
    </div>
  );
}
