import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Video, VideoOff, MessageSquare, Users, X, Send } from 'lucide-react';

// Initialize Supabase client
const SB_URL = 'https://nrpiojdaltgfgswvhrys.supabase.co';
const SB_KEY = 'sb_publishable_nu-if7EcpRJkKD9bXM97Rg__X3ELLW7';
const supabase = createClient(supabaseUrl, supabaseKey);

const ShloopkySharing = () => {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isSearching, setIsSearching] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [interests, setInterests] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const messageChannelRef = useRef(null);

  // Initialize database tables on mount
  useEffect(() => {
    initializeDatabase();
    return () => {
      cleanup();
    };
  }, []);

  // Subscribe to partner connection
  useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel(`room_${[userId, partnerId].sort().join('_')}`)
      .on('broadcast', { event: 'message' }, (payload) => {
        if (payload.payload.from !== userId) {
          setMessages(prev => [...prev, { 
            text: payload.payload.text, 
            sender: 'partner' 
          }]);
        }
      })
      .on('broadcast', { event: 'signal' }, async (payload) => {
        if (payload.payload.to === userId) {
          await handleSignal(payload.payload);
        }
      })
      .on('broadcast', { event: 'disconnect' }, (payload) => {
        if (payload.payload.userId !== userId) {
          handlePartnerDisconnect();
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [partnerId, userId]);

  // Presence system for matching
  useEffect(() => {
    if (!isSearching) return;

    const waitingChannel = supabase.channel('waiting_room', {
      config: { presence: { key: userId } }
    });

    waitingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = waitingChannel.presenceState();
        const users = Object.keys(state).filter(id => id !== userId);
        
        if (users.length > 0 && !partnerId) {
          matchWithUser(users[0]);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await waitingChannel.track({
            userId,
            interests: interests.toLowerCase().split(',').map(i => i.trim()),
            timestamp: Date.now()
          });
        }
      });

    return () => {
      waitingChannel.unsubscribe();
    };
  }, [isSearching, userId, interests, partnerId]);

  const initializeDatabase = async () => {
    // Tables should be created via Supabase dashboard:
    // - waiting_users (id, user_id, interests, created_at)
    // - active_connections (id, user1_id, user2_id, created_at)
  };

  const matchWithUser = async (otherUserId) => {
    setPartnerId(otherUserId);
    setIsSearching(false);
    setConnectionStatus('connecting');
    
    // Initiator creates offer
    if (userId > otherUserId) {
      await createOffer(otherUserId);
    }
  };

  const createOffer = async (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal(targetUserId, { type: 'ice-candidate', candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionStatus(pc.connectionState);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(targetUserId, { type: 'offer', offer });
  };

  const handleSignal = async (signal) => {
    if (!pcRef.current) {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal(signal.from, { type: 'ice-candidate', candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        setConnectionStatus(pc.connectionState);
      };
    }

    if (signal.type === 'offer') {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      sendSignal(signal.from, { type: 'answer', answer });
    } else if (signal.type === 'answer') {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
    } else if (signal.type === 'ice-candidate') {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  };

  const sendSignal = async (targetUserId, signal) => {
    if (!channelRef.current) return;
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'signal',
      payload: { ...signal, from: userId, to: targetUserId }
    });
  };

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (pcRef.current) {
        stream.getTracks().forEach(track => {
          pcRef.current.addTrack(track, stream);
        });
      }

      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      setIsSharing(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
      alert('Failed to share screen. Please grant permission and try again.');
    }
  };

  const stopSharing = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    setIsSharing(false);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !partnerId) return;

    const msg = { text: messageInput, sender: 'me' };
    setMessages(prev => [...prev, msg]);

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: { text: messageInput, from: userId }
      });
    }

    setMessageInput('');
  };

  const startSearching = () => {
    setIsSearching(true);
    setMessages([]);
  };

  const stopSearching = () => {
    setIsSearching(false);
  };

  const disconnect = async () => {
    if (channelRef.current && partnerId) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'disconnect',
        payload: { userId }
      });
    }
    cleanup();
  };

  const handlePartnerDisconnect = () => {
    setMessages(prev => [...prev, { text: 'Partner disconnected', sender: 'system' }]);
    cleanup();
  };

  const cleanup = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setPartnerId(null);
    setIsSharing(false);
    setConnectionStatus('disconnected');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Shloopky Sharing</h1>
          <p className="text-white/90 text-lg">Share screens with strangers around the world</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
          {!partnerId && !isSearching ? (
            // Landing page
            <div className="text-center py-12">
              <div className="mb-8">
                <Video className="w-24 h-24 text-white mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">Ready to connect?</h2>
                <p className="text-white/80 mb-6">Share your screen and chat with random people</p>
              </div>

              <div className="max-w-md mx-auto mb-6">
                <label className="block text-white text-left mb-2 font-semibold">
                  Interests (optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g., coding, gaming, art"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <button
                onClick={startSearching}
                className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg"
              >
                <Users className="inline-block w-6 h-6 mr-2" />
                Start Connecting
              </button>
            </div>
          ) : isSearching ? (
            // Searching state
            <div className="text-center py-12">
              <div className="animate-pulse mb-6">
                <Users className="w-24 h-24 text-white mx-auto" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Looking for a partner...</h2>
              <p className="text-white/80 mb-6">
                {interests ? `Searching for people interested in: ${interests}` : 'Connecting you with someone'}
              </p>
              <button
                onClick={stopSearching}
                className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            // Connected state
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Video Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">Partner's Screen</h3>
                    <span className="text-xs text-white/70 bg-white/20 px-2 py-1 rounded-full">
                      {connectionStatus}
                    </span>
                  </div>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-96 bg-gray-900 rounded-lg object-contain"
                  />
                </div>

                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">Your Screen</h3>
                    <button
                      onClick={isSharing ? stopSharing : startSharing}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        isSharing
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isSharing ? (
                        <>
                          <VideoOff className="inline w-4 h-4 mr-2" />
                          Stop Sharing
                        </>
                      ) : (
                        <>
                          <Video className="inline w-4 h-4 mr-2" />
                          Share Screen
                        </>
                      )}
                    </button>
                  </div>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-gray-900 rounded-lg object-contain"
                  />
                </div>

                <button
                  onClick={disconnect}
                  className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
                >
                  <X className="inline w-5 h-5 mr-2" />
                  Disconnect & Find New Partner
                </button>
              </div>

              {/* Chat Area */}
              <div className="bg-black/30 rounded-xl p-4 flex flex-col h-[calc(100vh-200px)] lg:h-auto">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white mr-2" />
                  <h3 className="text-white font-semibold text-lg">Chat</h3>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-[300px]">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.sender === 'me'
                          ? 'bg-blue-500 text-white ml-8'
                          : msg.sender === 'system'
                          ? 'bg-yellow-500/50 text-white text-center text-sm'
                          : 'bg-white/20 text-white mr-8'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/70 text-sm">
          <p>Always be respectful. Screen sharing is monitored for safety.</p>
        </div>
      </div>
    </div>
  );
};

export default ShloopkySharing;
