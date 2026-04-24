import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Play, Square, Zap, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { alertAPI, cameraAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import AlertBadge, { SeverityBadge } from '../components/AlertBadge';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Webcam Feed ──────────────────────────────────────────────────────────────
const WebcamFeed = ({ onAnalyze }) => {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive]   = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current     = stream;
      videoRef.current.srcObject = stream;
      setActive(true);
      toast.success('Webcam started');
    } catch { toast.error('Cannot access webcam'); }
  };

  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    clearInterval(intervalId);
    setActive(false);
    setAnalyzing(false);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !active) return null;
    const canvas = document.createElement('canvas');
    canvas.width  = 640;
    canvas.height = 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.6).split(',')[1]; // base64
  }, [active]);

  const startAnalysis = () => {
    setAnalyzing(true);
    const id = setInterval(async () => {
      const frameData = captureFrame();
      if (!frameData) return;
      onAnalyze({ frameData, cameraId: 'webcam-01', cameraName: 'Webcam', location: 'Browser' });
    }, 5000); // Analyze every 5 seconds
    setIntervalId(id);
  };

  const stopAnalysis = () => {
    clearInterval(intervalId);
    setAnalyzing(false);
  };

  useEffect(() => () => stopCam(), []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-surface rounded-xl overflow-hidden border border-surface-border scanline">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Camera size={40} className="opacity-30" />
            <p className="text-sm">Webcam feed inactive</p>
          </div>
        )}
        {active && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded bg-black/60 text-xs text-white">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            LIVE
          </div>
        )}
        {analyzing && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 rounded bg-brand/80 text-xs text-white">
            <Loader2 size={10} className="animate-spin" /> AI Analyzing
          </div>
        )}
      </div>
      <div className="flex gap-3">
        {!active ? (
          <button onClick={startCam} className="btn-primary flex items-center gap-2 flex-1">
            <Camera size={14} /> Start Webcam
          </button>
        ) : (
          <>
            {!analyzing ? (
              <button onClick={startAnalysis} className="btn-primary flex items-center gap-2 flex-1">
                <Play size={14} /> Start AI Analysis
              </button>
            ) : (
              <button onClick={stopAnalysis} className="flex items-center gap-2 flex-1 btn-ghost border border-warning/30 text-warning">
                <Square size={14} /> Stop Analysis
              </button>
            )}
            <button onClick={stopCam} className="btn-ghost border border-surface-border">
              <Square size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Video Upload Zone ────────────────────────────────────────────────────────
const VideoUploadZone = ({ onAnalyze }) => {
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]     = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setResult(null); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'] },
    maxSize: 100 * 1024 * 1024,
    multiple: false,
  });

  const analyze = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('cameraId', 'upload-feed');
      fd.append('cameraName', 'Uploaded Video');
      fd.append('location', 'Manual Upload');
      const res = await alertAPI.uploadDetect(fd);
      setResult(res.data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive ? 'border-brand bg-brand/10' : 'border-surface-border hover:border-slate-500'
        )}
      >
        <input {...getInputProps()} />
        <Upload size={32} className={clsx('mx-auto mb-3', isDragActive ? 'text-brand' : 'text-slate-500')} />
        {file ? (
          <div>
            <p className="text-white font-semibold text-sm">{file.name}</p>
            <p className="text-slate-400 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div>
            <p className="text-slate-300 text-sm font-medium">
              {isDragActive ? 'Drop video here' : 'Drag & drop a video file'}
            </p>
            <p className="text-slate-500 text-xs mt-1">MP4, AVI, MOV, MKV · Max 100MB</p>
          </div>
        )}
      </div>

      {file && (
        <button onClick={analyze} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Zap size={14} /> Run AI Analysis</>}
        </button>
      )}

      {result && (
        <div className={clsx(
          'p-4 rounded-xl border',
          result.data?.type === 'normal' ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'
        )}>
          <div className="flex items-center gap-3 mb-3">
            {result.data?.type === 'normal'
              ? <CheckCircle size={18} className="text-success" />
              : <AlertTriangle size={18} className="text-danger" />
            }
            <h4 className="font-semibold text-white">Analysis Result</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Detected</p>
              <AlertBadge type={result.data?.type} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Confidence</p>
              <p className="text-white font-semibold">{((result.data?.confidence || 0) * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Severity</p>
              <SeverityBadge severity={result.data?.severity} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Alert ID</p>
              <p className="text-slate-300 text-xs font-mono">{result.data?._id?.slice(-8)}</p>
            </div>
          </div>
          {result.data?.description && (
            <p className="text-slate-400 text-xs mt-3">{result.data.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Camera Page ─────────────────────────────────────────────────────────
export default function CameraPage() {
  const { liveAlerts, joinCamera } = useSocket();
  const [tab, setTab]   = useState('upload'); // 'webcam' | 'upload'
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    cameraAPI.getAll().then(r => {
      setCameras(r.data.data);
      r.data.data.forEach(c => joinCamera(c.cameraId));
    }).catch(() => {});
  }, []);

  const handleAnalyze = async (payload) => {
    try {
      await alertAPI.detect(payload);
    } catch (err) {
      console.warn('Detection error:', err.message);
    }
  };

  const recentActivity = liveAlerts.filter(a => a.type !== 'normal').slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Camera Feed</h1>
        <p className="text-slate-400 text-sm mt-1">Upload video or use webcam for real-time AI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab selector */}
          <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit">
            {[{ id: 'upload', label: '📁 Upload Video' }, { id: 'webcam', label: '📷 Webcam' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  tab === t.id ? 'bg-brand text-white' : 'text-slate-400 hover:text-white'
                )}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="card">
            {tab === 'webcam'
              ? <WebcamFeed onAnalyze={handleAnalyze} />
              : <VideoUploadZone onAnalyze={handleAnalyze} />
            }
          </div>

          {/* Camera grid */}
          {cameras.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white text-sm mb-4">Registered Cameras</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cameras.map(cam => (
                  <div key={cam._id} className="bg-surface border border-surface-border rounded-lg p-3">
                    <div className="aspect-video bg-surface-border rounded mb-2 flex items-center justify-center scanline relative">
                      <Camera size={18} className="text-slate-600" />
                      <div className={clsx('absolute top-1.5 right-1.5 w-2 h-2 rounded-full', cam.status === 'online' ? 'bg-success' : 'bg-slate-600')} />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{cam.name}</p>
                    <p className="text-xs text-slate-500">{cam.location} · {cam.zone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Live Activity</h3>
              {recentActivity.length > 0 && (
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              )}
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No incidents detected</p>
                <p className="text-xs mt-1">System is monitoring...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-surface-border animate-fade-in">
                    <AlertBadge type={alert.type} small />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white capitalize">
                        {alert.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {alert.camera?.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {(alert.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Model info */}
          <div className="card border border-brand/20 bg-brand/5">
            <h3 className="font-semibold text-white text-sm mb-3">AI Model Info</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Model',    value: 'Action Recognition v2' },
                { label: 'Backend',  value: 'PyTorch / TensorFlow' },
                { label: 'Classes',  value: 'Fight, Fall, Crowd, Normal' },
                { label: 'Latency',  value: '~150-400ms/frame' },
                { label: 'Status',   value: 'Mock (Dev Mode)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
