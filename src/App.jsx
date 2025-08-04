import React, { useState, useEffect, useRef } from 'react';
import { Link, Send, Copy, AlertTriangle, Bug, Coffee, Sun, Moon, User, Ghost, ArrowDownCircle, Mail } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'; // getDoc dan setDoc tidak lagi dibutuhkan di sini
import noteIconSvg from './assets/note-icon.svg?raw';
import './index.css';

// Konfigurasi Firebase dari Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
    const [nglUsername, setNglUsername] = useState('');
    const [messageText, setMessageText] = useState('');
    const [disguisedLink, setDisguisedLink] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [isMessageSent, setIsMessageSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(true);
    const [userCount, setUserCount] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const audioRef = useRef(null);

    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else {
            setIsMessageSent(false);
        }
        return () => clearTimeout(timer);
    }, [timeLeft]);

    useEffect(() => {
        const counterRef = doc(db, 'stats', 'userCounter');
        const unsubscribe = onSnapshot(counterRef, (doc) => {
            if (doc.exists()) {
                setUserCount(doc.data().count);
            } else {
                setUserCount(0);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!showWelcomePopup && window.tsParticles) {
            const loadParticles = async () => {
                await window.tsParticles.load({
                    id: "tsparticles",
                    options: {
                        fullScreen: { enable: true, zIndex: -1 },
                        background: { color: { value: "transparent" } },
                        particles: {
                            color: { value: "#3b82f6" },
                            shape: {
                                type: "image",
                                image: { src: `data:image/svg+xml;base64,${btoa(noteIconSvg)}` },
                            },
                            size: { value: 20 },
                            number: { value: 50 },
                            links: { enable: false },
                            opacity: { value: 0.5 },
                            move: {
                                enable: true,
                                speed: 3,
                                direction: "top",
                                random: true,
                                straight: false,
                                outMode: "out",
                            },
                        },
                        interactivity: {
                            events: { onHover: { enable: true, mode: "repulse" } },
                            modes: { repulse: { distance: 100 } },
                        },
                    },
                });
            };
            loadParticles();
        }
    }, [showWelcomePopup]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    // --- FUNGSI INI TELAH DIPERBAIKI ---
    const handleWelcomePopupClose = () => {
        // Hapus semua logika database dari sini
        setShowWelcomePopup(false);
        setIsInitialLoad(false);
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Autoplay was prevented:", e));
        }
    };

    const handleCreateLink = async () => {
        if (!nglUsername.trim()) {
            setError('Nama pengguna NGL tidak boleh kosong!');
            return;
        }
        setLoading(true);
        setError('');
        setResponseMessage('');
        try {
            const response = await fetch('/api/create-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nglUsername }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal membuat tautan.');
            }
            const data = await response.json();
            setDisguisedLink(`${window.location.origin}/?id=${data.disguisedId}`);
            setResponseMessage('Tautan berhasil dibuat!');
        } catch (err) {
            console.error('Gagal membuat tautan:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(disguisedLink)
            .then(() => alert('Tautan disalin ke clipboard!'))
            .catch(err => console.error('Gagal menyalin:', err));
    };

    const handleSendMessage = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const disguisedId = urlParams.get('id');
        if (!messageText.trim()) {
            setError('Pesan tidak boleh kosong!');
            return;
        }
        if (!disguisedId) {
            setError('Tautan samaran tidak valid.');
            return;
        }
        setLoading(true);
        setError('');
        setResponseMessage('');
        try {
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disguisedId, messageText }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal mengirim pesan.');
            }
            const data = await response.json();
            setResponseMessage(data.message);
            setMessageText('');
            setIsMessageSent(true);
            setTimeLeft(180);
        } catch (err) {
            console.error('Gagal mengirim pesan:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // -- RENDERER UNTUK HALAMAN PEMBUAT TAUTAN --
    const renderLinkGenerator = () => (
        <div className={`relative min-h-screen p-4 flex flex-col items-center justify-center font-sans transition-colors duration-500 animate-background ${isDarkMode ? 'dark bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-200' : 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 text-gray-800'}`}>
            <div className={`p-1 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-pink-500 to-purple-600' : 'from-pink-400 to-purple-500'} w-full max-w-md mx-auto shadow-2xl`}>
                <div className={`w-full p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h1 className="text-3xl font-bold mb-2 text-center">Buat Tautan Samaran</h1>
                    <p className={`mb-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Masukkan nama pengguna NGL Anda untuk melindungi link asli dari spam.
                    </p>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={nglUsername}
                            onChange={(e) => setNglUsername(e.target.value)}
                            placeholder="Contoh: noxm007"
                            className={`w-full p-3 pl-10 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                        />
                        <Link size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    
                    {error && (
                        <div className="flex items-center text-red-500 mb-4 bg-red-100 p-3 rounded-lg">
                            <AlertTriangle size={20} className="mr-2" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    {responseMessage && !disguisedLink && (
                        <div className="text-green-500 mb-4 text-center">{responseMessage}</div>
                    )}

                    <button
                        onClick={handleCreateLink}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Membuat...' : 'Buat Tautan'}
                    </button>

                    {disguisedLink && (
                        <div className="mt-6 p-3 rounded-lg border flex items-center justify-between shadow-inner animate-fade-in bg-gray-50">
                            <span className="truncate text-sm text-gray-600">{disguisedLink}</span>
                            <button onClick={copyToClipboard} className="ml-4 p-2 rounded-md bg-pink-500 text-white hover:bg-pink-600 transition-colors" title="Salin Tautan">
                                <Copy size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap">
                <span className="font-semibold text-white text-shadow dark:text-gray-300">
                    Dibuat dengan <span className="text-pink-400">🩷</span> oleh{' '}
                    <a 
                        href="https://instagram.com/nelson.oxm007" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-green-300 dark:text-green-400 hover:underline"
                    >
                        Noxm007
                    </a>
                </span>
            </div>
        </div>
    );

    // -- RENDERER UNTUK HALAMAN PENGIRIMAN PESAN --
    const renderMessageForm = () => {
      const username = 'anonym'; 
      
      return (
        <div className={`relative min-h-screen p-4 flex flex-col items-center justify-center font-sans transition-colors duration-500 animate-background ${isDarkMode ? 'dark bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-200' : 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 text-gray-800'}`}>
            <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-1 bg-gradient-to-br ${isDarkMode ? 'from-pink-500 to-purple-600' : 'from-pink-400 to-purple-500'}`}>
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-[22px]`}>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                            <div className="font-bold text-lg">@{username}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">kirimi aku pesan anonim!</div>
                        </div>
                    </div>
                    <div className="relative mb-4">
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Kirim pesan rahasia..."
                            className={`w-full p-4 rounded-xl transition-all resize-none h-40 border-2 ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-pink-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-200 focus:border-pink-400'} focus:outline-none focus:ring-0`}
                        />
                        <div className="absolute bottom-3 right-3 text-gray-400 dark:text-gray-500">
                           <Ghost size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-sm my-4">
                {error && (
                    <div className="flex items-center text-red-500 mb-4 bg-red-100 p-3 rounded-lg">
                        <AlertTriangle size={20} className="mr-2" />
                        <span className="text-sm text-center">{error}</span>
                    </div>
                )}
                {responseMessage && (
                    <div className="text-green-600 mb-4 text-center font-semibold">{responseMessage}</div>
                )}
                <button
                    onClick={handleSendMessage}
                    disabled={loading || isMessageSent}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 transition-all duration-300 transform shadow-lg ${ (loading || isMessageSent) ? 'opacity-50 cursor-not-allowed' : '' }`}
                >
                    {loading ? 'Mengirim...' : 'Kirim!'}
                </button>
            </div>

            {isMessageSent && (
                <p className="text-center text-sm font-semibold text-white text-shadow dark:text-gray-300 mt-2">
                    Anda dapat mengirim pesan lagi dalam {timeLeft} detik.
                </p>
            )}
            
            <div className="w-full max-w-sm mt-6 text-center text-sm">
                <span className="block mb-2 font-semibold text-white text-shadow dark:text-gray-300">
                  <ArrowDownCircle size={16} className="inline-block mx-1" />
                  {userCount} orang telah bergabung!
                  <ArrowDownCircle size={16} className="inline-block mx-1" />
                </span>
                <a href="/" className="flex items-center justify-center w-full py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <Mail size={20} className="mr-2" />
                    Dapatkan Pesan Untukmu Sendiri!
                </a>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap">
                <span className="font-semibold text-white text-shadow dark:text-gray-300">
                    Dibuat dengan <span className="text-pink-400">🩷</span> oleh{' '}
                    <a 
                        href="https://instagram.com/nelson.oxm007" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-green-300 dark:text-green-400 hover:underline"
                    >
                        Noxm007
                    </a>
                </span>
            </div>
        </div>
      );
    };

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    return (
        <div className={`min-h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
            {showWelcomePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] animate-fade-in">
                    <div className="bg-white p-8 rounded-xl max-w-sm mx-auto text-center shadow-2xl transition-all duration-500 transform scale-100 opacity-100 animate-fade-in-up">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Selamat Datang!</h2>
                        <p className="text-gray-600 mb-6">
                            Bersiaplah untuk pengalaman NGL.link tanpa spam! Kirim pesan anonim dengan tenang dan aman.
                        </p>
                        <button onClick={handleWelcomePopupClose} className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300">
                            Oke
                        </button>
                    </div>
                </div>
            )}
            <button onClick={toggleDarkMode} className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/20 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            
            {userId ? renderMessageForm() : renderLinkGenerator()}

            <div className="fixed bottom-4 right-4 flex flex-col space-y-4 z-50">
                <a href="https://ko-fi.com/" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white shadow-lg transition-transform hover:scale-110">
                    <Coffee size={24} />
                </a>
                <a href="https://wa.me/6287838901041?text=web+Ngl+Pro+nya+bermasalah+bang" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white shadow-lg transition-transform hover:scale-110">
                    <Bug size={24} />
                </a>
            </div>
            <audio ref={audioRef} src="https://files.catbox.moe/gj0me1.mp3" loop />
            <div id="tsparticles" className={`fixed inset-0 pointer-events-none z-[-1] ${showWelcomePopup ? 'hidden' : ''}`} />
        </div>
    );
};

export default App;
