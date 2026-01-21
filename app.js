import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Search, TrendingUp, Users, Clock, Eye, ThumbsUp, MessageSquare, Filter, X, ChevronDown, ChevronUp, Flag, Share2, Bookmark, Hash, Bell, User, Settings, LogOut, Menu } from 'lucide-react';

const ForumPlatform = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [boards, setBoards] = useState([
    { id: 1, name: 'General', slug: 'gen', description: 'General discussion', color: 'bg-blue-500', posts: 1247, active: 234 },
    { id: 2, name: 'Technology', slug: 'tech', description: 'Tech talk and programming', color: 'bg-green-500', posts: 892, active: 156 },
    { id: 3, name: 'Gaming', slug: 'v', description: 'Video games discussion', color: 'bg-purple-500', posts: 2103, active: 421 },
    { id: 4, name: 'Music', slug: 'mu', description: 'Music and audio', color: 'bg-pink-500', posts: 634, active: 98 },
    { id: 5, name: 'Fitness', slug: 'fit', description: 'Health and fitness', color: 'bg-red-500', posts: 456, active: 87 },
    { id: 6, name: 'Food', slug: 'ck', description: 'Cooking and food', color: 'bg-orange-500', posts: 521, active: 76 },
  ]);
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showSidebar, setShowSidebar] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState([]);

  // Initialize with sample threads
  useEffect(() => {
    const sampleThreads = [
      { id: 1, boardId: 1, title: 'Welcome to the forum!', author: 'Admin', userId: 'admin1', createdAt: Date.now() - 3600000, replies: 45, views: 892, lastActivity: Date.now() - 300000, pinned: true, locked: false },
      { id: 2, boardId: 2, title: 'Best programming languages in 2025?', author: 'CodeMaster', userId: 'user1', createdAt: Date.now() - 7200000, replies: 128, views: 2341, lastActivity: Date.now() - 180000, pinned: false, locked: false },
      { id: 3, boardId: 3, title: 'Game recommendations thread', author: 'GamerDude', userId: 'user2', createdAt: Date.now() - 14400000, replies: 203, views: 4521, lastActivity: Date.now() - 120000, pinned: false, locked: false },
    ];
    setThreads(sampleThreads);
  }, []);

  const login = (username) => {
    setCurrentUser({ username, userId: `user_${Date.now()}`, joinDate: Date.now(), posts: 0 });
    setShowLogin(false);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const createThread = (boardId, title, content) => {
    if (!currentUser) {
      alert('Please login to create threads');
      return;
    }
    const newThread = {
      id: threads.length + 1,
      boardId,
      title,
      author: currentUser.username,
      userId: currentUser.userId,
      createdAt: Date.now(),
      replies: 0,
      views: 0,
      lastActivity: Date.now(),
      pinned: false,
      locked: false,
    };
    setThreads([newThread, ...threads]);
    
    const firstPost = {
      id: posts.length + 1,
      threadId: newThread.id,
      content,
      author: currentUser.username,
      userId: currentUser.userId,
      createdAt: Date.now(),
      likes: 0,
      isOP: true,
    };
    setPosts([firstPost, ...posts]);
    setShowNewThread(false);
    setSelectedThread(newThread.id);
    setCurrentView('thread');
  };

  const createPost = (threadId, content) => {
    if (!currentUser) {
      alert('Please login to post');
      return;
    }
    const newPost = {
      id: posts.length + 1,
      threadId,
      content,
      author: currentUser.username,
      userId: currentUser.userId,
      createdAt: Date.now(),
      likes: 0,
      isOP: false,
    };
    setPosts([...posts, newPost]);
    setThreads(threads.map(t => 
      t.id === threadId 
        ? { ...t, replies: t.replies + 1, lastActivity: Date.now() }
        : t
    ));
  };

  const toggleBookmark = (threadId) => {
    if (!currentUser) return;
    if (userBookmarks.includes(threadId)) {
      setUserBookmarks(userBookmarks.filter(id => id !== threadId));
    } else {
      setUserBookmarks([...userBookmarks, threadId]);
    }
  };

  const likePost = (postId) => {
    if (!currentUser) return;
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredThreads = threads.filter(thread => {
    if (selectedBoard && thread.boardId !== selectedBoard.id) return false;
    if (searchQuery && !thread.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === 'recent') return b.lastActivity - a.lastActivity;
    if (sortBy === 'popular') return b.replies - a.replies;
    if (sortBy === 'views') return b.views - a.views;
    return b.createdAt - a.createdAt;
  });

  const threadPosts = posts.filter(p => p.threadId === selectedThread);

  const NewThreadModal = () => {
    const [newThreadData, setNewThreadData] = useState({ title: '', content: '', boardId: selectedBoard?.id || boards[0].id });
    
    const handleCreateThread = () => {
      if (!newThreadData.title || !newThreadData.content) {
        alert('Please fill in all fields');
        return;
      }
      createThread(newThreadData.boardId, newThreadData.title, newThreadData.content);
      setNewThreadData({ title: '', content: '', boardId: selectedBoard?.id || boards[0].id });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Create New Thread</h2>
            <button onClick={() => setShowNewThread(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Board</label>
              <select 
                value={newThreadData.boardId}
                onChange={(e) => setNewThreadData({...newThreadData, boardId: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                {boards.map(board => (
                  <option key={board.id} value={board.id}>{board.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Thread Title</label>
              <input 
                type="text" 
                value={newThreadData.title}
                onChange={(e) => setNewThreadData({...newThreadData, title: e.target.value})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                placeholder="Enter thread title..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Content</label>
              <textarea 
                value={newThreadData.content}
                onChange={(e) => setNewThreadData({...newThreadData, content: e.target.value})}
                rows={6}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                placeholder="Write your post..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateThread} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex-1">
                Create Thread
              </button>
              <button 
                onClick={() => setShowNewThread(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoginModal = () => {
    const [username, setUsername] = useState('');
    
    const handleLogin = () => {
      if (!username.trim()) {
        alert('Please enter a username');
        return;
      }
      login(username);
      setUsername('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Login / Register</h2>
            <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                placeholder="Choose a username..."
              />
            </div>
            <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu size={24} />
              </button>
              <h1 
                className="text-2xl font-bold text-blue-400 cursor-pointer"
                onClick={() => { setCurrentView('home'); setSelectedBoard(null); setSelectedThread(null); }}
              >
                ForumHub
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded w-64"
                />
              </div>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-white relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                  </button>
                  <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded">
                    <User size={18} />
                    <span className="text-sm">{currentUser.username}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="text-gray-400 hover:text-white"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="w-64 flex-shrink-0">
              <div className="bg-gray-800 rounded-lg p-4 sticky top-20">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Hash size={20} />
                  Boards
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedBoard(null); setCurrentView('home'); }}
                    className={`w-full text-left px-3 py-2 rounded ${!selectedBoard ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  >
                    All Boards
                  </button>
                  {boards.map(board => (
                    <button
                      key={board.id}
                      onClick={() => { setSelectedBoard(board); setCurrentView('board'); }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${selectedBoard?.id === board.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${board.color}`} />
                      <div className="flex-1">
                        <div className="font-medium">{board.name}</div>
                        <div className="text-xs text-gray-400">{board.active} active</div>
                      </div>
                    </button>
                  ))}
                </div>

                {currentUser && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="text-sm font-bold mb-2 text-gray-400">YOUR STATS</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Posts:</span>
                        <span>{currentUser.posts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bookmarks:</span>
                        <span>{userBookmarks.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {/* Thread List View */}
            {(currentView === 'home' || currentView === 'board') && (
              <div>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                      {selectedBoard ? selectedBoard.name : 'All Threads'}
                    </h2>
                    <button 
                      onClick={() => currentUser ? setShowNewThread(true) : setShowLogin(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
                    >
                      <Plus size={20} />
                      New Thread
                    </button>
                  </div>

                  {selectedBoard && (
                    <p className="text-gray-400 text-sm mb-4">{selectedBoard.description}</p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="popular">Most Replies</option>
                      <option value="views">Most Views</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredThreads.map(thread => {
                    const board = boards.find(b => b.id === thread.boardId);
                    return (
                      <div 
                        key={thread.id}
                        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 cursor-pointer"
                        onClick={() => { setSelectedThread(thread.id); setCurrentView('thread'); }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded ${board.color} flex items-center justify-center flex-shrink-0`}>
                            <MessageCircle size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {thread.pinned && (
                                <span className="bg-green-600 text-xs px-2 py-0.5 rounded">PINNED</span>
                              )}
                              {thread.locked && (
                                <span className="bg-red-600 text-xs px-2 py-0.5 rounded">LOCKED</span>
                              )}
                              <span className="text-xs text-gray-400">/{board.slug}/</span>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{thread.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>by {thread.author}</span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatTime(thread.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-sm">
                            <div className="flex items-center gap-4 text-gray-400">
                              <span className="flex items-center gap-1">
                                <MessageSquare size={16} />
                                {thread.replies}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={16} />
                                {thread.views}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Last: {formatTime(thread.lastActivity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thread View */}
            {currentView === 'thread' && selectedThread && (
              <div>
                {(() => {
                  const thread = threads.find(t => t.id === selectedThread);
                  const board = boards.find(b => b.id === thread?.boardId);
                  return (
                    <>
                      <div className="bg-gray-800 rounded-lg p-4 mb-4">
                        <button 
                          onClick={() => setCurrentView(selectedBoard ? 'board' : 'home')}
                          className="text-blue-400 hover:text-blue-300 mb-3 text-sm"
                        >
                          ← Back to threads
                        </button>
                        <div className="flex items-start gap-3 mb-4">
                          <div className={`w-12 h-12 rounded ${board?.color} flex items-center justify-center flex-shrink-0`}>
                            <MessageCircle size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-400">/{board?.slug}/</span>
                              {thread?.pinned && (
                                <span className="bg-green-600 text-xs px-2 py-0.5 rounded">PINNED</span>
                              )}
                            </div>
                            <h1 className="text-2xl font-bold mb-2">{thread?.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>Started by {thread?.author}</span>
                              <span>{formatTime(thread?.createdAt)}</span>
                              <span>{thread?.replies} replies</span>
                              <span>{thread?.views} views</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleBookmark(thread.id); }}
                              className={`p-2 rounded ${userBookmarks.includes(thread.id) ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600`}
                            >
                              <Bookmark size={18} />
                            </button>
                            <button className="p-2 bg-gray-700 rounded hover:bg-gray-600">
                              <Share2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        {threadPosts.map((post, index) => (
                          <div key={post.id} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                  {post.author[0].toUpperCase()}
                                </div>
                                {post.isOP && (
                                  <span className="bg-green-600 text-xs px-2 py-0.5 rounded mt-2 inline-block">OP</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="font-semibold">{post.author}</span>
                                    <span className="text-gray-400 text-sm ml-3">
                                      {formatTime(post.createdAt)}
                                    </span>
                                  </div>
                                  <span className="text-gray-500 text-sm">#{index + 1}</span>
                                </div>
                                <p className="text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>
                                <div className="flex items-center gap-3 text-sm">
                                  <button 
                                    onClick={() => likePost(post.id)}
                                    className="flex items-center gap-1 text-gray-400 hover:text-blue-400"
                                  >
                                    <ThumbsUp size={16} />
                                    <span>{post.likes}</span>
                                  </button>
                                  <button className="flex items-center gap-1 text-gray-400 hover:text-blue-400">
                                    <MessageSquare size={16} />
                                    Reply
                                  </button>
                                  <button className="flex items-center gap-1 text-gray-400 hover:text-red-400">
                                    <Flag size={16} />
                                    Report
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {!thread?.locked && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h3 className="font-bold mb-3">Reply to thread</h3>
                          {currentUser ? (
                            <div>
                              <textarea 
                                id="replyContent"
                                rows={4}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-3"
                                placeholder="Write your reply..."
                              />
                              <button 
                                onClick={() => {
                                  const content = document.getElementById('replyContent').value;
                                  if (content.trim()) {
                                    createPost(selectedThread, content);
                                    document.getElementById('replyContent').value = '';
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                              >
                                Post Reply
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-400 mb-3">You must be logged in to reply</p>
                              <button 
                                onClick={() => setShowLogin(true)}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                              >
                                Login to Reply
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </main>

          {/* Right Sidebar - Stats */}
          <aside className="w-64 flex-shrink-0 hidden xl:block">
            <div className="bg-gray-800 rounded-lg p-4 sticky top-20">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Forum Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Threads:</span>
                  <span className="font-semibold">{threads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Posts:</span>
                  <span className="font-semibold">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Users:</span>
                  <span className="font-semibold text-green-400">
                    {boards.reduce((sum, b) => sum + b.active, 0)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-bold mb-3 text-sm">TRENDING BOARDS</h3>
                <div className="space-y-2">
                  {boards.sort((a, b) => b.active - a.active).slice(0, 3).map(board => (
                    <div key={board.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${board.color}`} />
                      <span className="text-sm">{board.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showNewThread && <NewThreadModal />}
      {showLogin && <LoginModal />}
    </div>
  );
};

export default ForumPlatform;
