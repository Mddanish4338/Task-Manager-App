import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [taskLoading, setTaskLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check online status
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setOffline(!navigator.onLine);

    // Simple query without composite index requirements
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
      // Removed orderBy to avoid index requirements temporarily
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const tasksData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        
        // Sort locally instead of using Firestore orderBy
        tasksData.sort((a, b) => b.createdAt - a.createdAt);
        
        setTasks(tasksData);
        setTaskLoading(false);
        setError('');
        setOffline(false);
      }, 
      (error) => {
        console.error('Error fetching tasks:', error);
        
        if (error.code === 'failed-precondition') {
          setError('Database index required. Please create the Firestore composite index.');
        } else if (error.code === 'unavailable' || error.message.includes('INTERNET_DISCONNECTED')) {
          setOffline(true);
          setError('You are offline. Tasks will sync when connection is restored.');
        } else if (error.code === 'permission-denied') {
          setError('Permission denied. Please check Firestore security rules.');
        } else {
          setError('Failed to load tasks: ' + error.message);
        }
        setTaskLoading(false);
      }
    );

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const taskData = {
        title: newTask.trim(),
        completed: false,
        category: 'Personal',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        priority: 'medium'
      };

      await addDoc(collection(db, 'tasks'), taskData);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
      
      if (error.code === 'failed-precondition') {
        setError('Database index required. Please create the Firestore composite index.');
      } else if (error.code === 'unavailable') {
        setError('You are offline. Task will be saved when connection is restored.');
      } else {
        setError('Failed to add task: ' + error.message);
      }
    }
    setLoading(false);
  };

  const toggleTask = async (taskId, completed) => {
    setError('');
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: !completed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task: ' + error.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setError('');
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task: ' + error.message);
    }
  };

  // Filter and sort tasks locally
  const filteredTasks = tasks
    .filter(task => {
      const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Sort by creation date (newest first)

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const completionPercentage = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🚀 Task Manager {offline && ' (Offline)'}
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? '🌙' : '☀️'}
              </button>
              <span className="text-gray-700 dark:text-gray-300 text-sm hidden sm:block">
                {currentUser.email}
              </span>
              <Button onClick={logout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        {offline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
          >
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <div>
                <strong>You are offline.</strong> Some features may be limited. 
                Tasks will sync when your connection is restored.
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-lg mr-2">❌</span>
                  <div>
                    <strong>Error:</strong> {error}
                    {error.includes('index') && (
                      <div className="mt-2">
                        <a 
                          href="https://console.firebase.google.com/v1/r/project/coursecraft-2bd9a/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9jb3Vyc2VjcmFmdC0yYmQ5YS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdGFza3MvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 hover:text-blue-800"
                        >
                          Click here to create the required index
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-lg hover:text-red-900 dark:hover:text-red-200 ml-4"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-full bg-blue-100 dark:bg-blue-900"
                >
                  <span className="text-2xl">📊</span>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="p-2 rounded-full bg-green-100 dark:bg-green-900"
                >
                  <span className="text-2xl">✅</span>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-full bg-orange-100 dark:bg-orange-900"
                >
                  <span className="text-2xl">⏳</span>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="p-2 rounded-full bg-purple-100 dark:bg-purple-900"
                >
                  <span className="text-2xl">📈</span>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Task Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading || offline}
                />
                <Button 
                  type="submit" 
                  disabled={loading || !newTask.trim() || offline}
                  title={offline ? "Cannot add tasks while offline" : "Add task"}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : offline ? (
                    'Offline'
                  ) : (
                    'Add Task'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0"
        >
          <div className="flex flex-wrap gap-2">
            {['All', 'Work', 'Personal', 'Study', 'Health'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white w-full sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>

        {/* Tasks List */}
        {taskLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {offline ? 'Trying to reconnect...' : 'Loading tasks...'}
            </p>
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: 5,
                    transition: { duration: 0.2 }
                  }}
                  className="cursor-pointer"
                >
                  <Card className={`${task.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800'} transition-all duration-200 hover:shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <motion.input
                            whileTap={{ scale: 0.9 }}
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id, task.completed)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={offline}
                          />
                          <div className="flex-1">
                            <p className={`font-medium text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                task.category === 'Work' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                task.category === 'Personal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                task.category === 'Study' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}>
                                {task.category}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {task.createdAt?.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors"
                          title="Delete task"
                          disabled={offline}
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!taskLoading && filteredTasks.length === 0 && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No tasks match your filters. Try changing your search or category.
            </p>
          </motion.div>
        )}

        {!taskLoading && tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add your first task above to get started!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}