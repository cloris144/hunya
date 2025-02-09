import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Search, Plus, Trash, Edit2, X } from 'lucide-react';

const VerificationList = ({ onVerificationSelect }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [selectedVerificationId, setSelectedVerificationId] = useState(null);
  const dropdownRef = useRef(null);
  const dropdownRefs = useRef({});


  const refreshVerifications = async () => {
    setLoading(true);
    setError(null);
    await fetchVerifications();
  };

  useEffect(() => {
    const handleRefresh = () => {
      refreshVerifications();
    };

    window.addEventListener('refreshVerifications', handleRefresh);

    return () => {
      window.removeEventListener('refreshVerifications', handleRefresh);
    };
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId !== null) {
        const dropdownElement = dropdownRefs.current[openDropdownId];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return;
      }
  
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/verifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'mode': 'cors',
          'credentials': 'include'
        }
      });
  
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        return;
      }
  
      if (response.status === 403) {
        setError('Access forbidden. Please check your permissions.');
        return;
      }
  
      if (!response.ok) {
        throw new Error(`Failed to fetch verifications: ${response.statusText}`);
      }
  
      const data = await response.json();
      const sortedVerifications = data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setVerifications(sortedVerifications);
  
      // If this is a refresh after creating a new verification,
      // auto-select the most recently created one
      if (sortedVerifications.length > 0) {
        const mostRecent = sortedVerifications[0];
        // Only auto-select if no verification is currently selected
        if (!selectedVerificationId) {
          setSelectedVerificationId(mostRecent.id);
          onVerificationSelect(mostRecent);
        }
      }
  
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server. Please check your connection or try again later.');
      } else {
        setError(err.message || 'An error occurred while fetching verifications');
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/verifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete verification');
      }

      setVerifications(prev => prev.filter(v => v.id !== id));
      if (selectedVerificationId === id) {
        setSelectedVerificationId(null);
        onVerificationSelect(null);
      }
      setOpenDropdownId(null);
      setActionError(null);
    } catch (err) {
      console.error('Delete error:', err);
      setActionError('Failed to delete verification. Please try again.');
    }
  };

  const handleRename = (id, e) => {
    e.stopPropagation();
    const verification = verifications.find(v => v.id === id);
    setNewName(verification.verification_name);
    setRenamingId(id);
    setIsRenaming(true);
    setOpenDropdownId(null);
  };

  const submitRename = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/verifications/${renamingId}/rename`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verification_name: newName })
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to rename verification');
      }

      setVerifications(prev => prev.map(v => 
        v.id === renamingId 
          ? { ...v, verification_name: newName }
          : v
      ));
      
      setIsRenaming(false);
      setRenamingId(null);
      setNewName('');
      setActionError(null);
    } catch (err) {
      console.error('Rename error:', err);
      setActionError('Failed to rename verification. Please try again.');
    }
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleVerificationClick = (verification) => {
    const newSelectedId = selectedVerificationId === verification.id ? null : verification.id;
    setSelectedVerificationId(newSelectedId);
    onVerificationSelect(newSelectedId === null ? null : verification);
  };

  const filteredVerifications = verifications.filter(item =>
    item.verification_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-700 h-10 w-10"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4">
        <div className="p-4 bg-red-500/20 text-red-400 rounded-lg">
          <p className="font-medium mb-2">Error Loading Verifications</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-md transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Search box */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search verifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {actionError && (
        <div className="mx-2 mt-2 p-4 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-red-500/30 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {isRenaming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-4">Rename Verification</h3>
            <form onSubmit={submitRename}>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-md mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRenaming(false);
                    setRenamingId(null);
                    setNewName('');
                  }}
                  className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 p-2 overflow-y-auto">
        {filteredVerifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p>No verifications found</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            )}
          </div>
               ) : (
                filteredVerifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedVerificationId === item.id ? 'bg-gray-700 ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleVerificationClick(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{item.verification_name}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => toggleDropdown(item.id, e)}
                    className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                  {openDropdownId === item.id && (
                    <div
                      ref={(el) => (dropdownRefs.current[item.id] = el)}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10"
                    >
                      <button
                        onClick={(e) => handleRename(item.id, e)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                      >
                        <Edit2 className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full text-left"
                      >
                        <Trash className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VerificationList;