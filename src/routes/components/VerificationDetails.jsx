import React, { useEffect, useState, memo } from 'react';
import { AlertCircle, FileText, Image, Download } from 'lucide-react';
import { diffWords } from 'diff';

const VerificationDetails = memo(({ verificationId, onDetailsLoaded }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const normalizeText = (text) => {
    return text.replace(/\s+/g, '').replace(/[。.]$/, '');
  };

  const handleDownload = async (fileType) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://162.38.2.150:8100/verifications/${verificationId}/${fileType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download ${fileType}`);
      }

      let filename = fileType === 'docx'
        ? details.docx_info?.filename || `verification-${verificationId}.docx`
        : details.image_info?.filename || `verification-${verificationId}.png`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error downloading ${fileType}:`, err);
      setError(`Failed to download ${fileType}. Please try again.`);
    }
  };

  useEffect(() => {
    if (!verificationId) {
      setDetails(null);
      return;
    }

    const fetchVerificationDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://162.38.2.150:8100/verifications/${verificationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch verification details');
        }

        const data = await response.json();
        setDetails(data);
        if (onDetailsLoaded) {
          onDetailsLoaded(data);
        }
      } catch (err) {
        console.error('Error fetching verification details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationDetails();
  }, [verificationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <div>
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  // Function to highlight OCR differences
  const getHighlightedText = (docText, ocrText) => {
    const normalizedDocText = normalizeText(docText || '');
    const normalizedOcrText = normalizeText(ocrText || '');
  
    const diff = diffWords(normalizedOcrText, normalizedDocText);
  
    return diff.map((part, index) => {
      if (part.added) {
        // Added text (should be green)
        return (
          <span key={index} className="bg-green-500/30 text-green-400 px-1 rounded">
            {part.value}
          </span>
        );
      } else if (part.removed) {
        // Removed text (should be red with strikethrough)
        return (
          <span key={index} className="bg-red-500/30 text-red-400 px-1 rounded line-through">
            {part.value}
          </span>
        );
      }
      return <span key={index}>{part.value}</span>;
    });
  };
  

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{details.verification_name}</h2>
          <p className="text-gray-400">Created: {new Date(details.created_at).toLocaleString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${details.status === 'completed'
          ? 'bg-green-500/20 text-green-400'
          : 'bg-yellow-500/20 text-yellow-400'
          }`}>
          {details.status}
        </span>
      </div>

      {/* File Status Section with Download Buttons */}
      <div className="space-y-3">
        {details.docx_info?.exists && (
          <div className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg">
            <FileText className="w-4 h-4 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-green-400 text-sm break-all">
                {details.docx_info.filename || 'Document'}
              </span>
            </div>
            <button
              onClick={() => handleDownload('docx')}
              className="ml-2 p-1 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        )}
        {details.image_info?.exists && (
          <div className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg">
            <Image className="w-4 h-4 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-green-400 text-sm break-all">
                {details.image_info.filename || 'Image'}
              </span>
            </div>
            <button
              onClick={() => handleDownload('image')}
              className="ml-2 p-1 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        )}
      </div>

      {/* Differences Section */}
      {details.differences?.compare_result && (
        <div className="mt-4 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Differences Found</h3>
          {details.differences.compare_result.invalid_titles?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-red-400 font-medium mb-2">Invalid Titles</h4>
              <ul className="list-disc list-inside">
                {details.differences.compare_result.invalid_titles.map((title, index) => (
                  <li key={index} className="text-gray-300">{title}</li>
                ))}
              </ul>
            </div>
          )}
          {Object.entries(details.differences.compare_result.differences).length > 0 && (
            <div>
              <h4 className="text-yellow-400 font-medium mb-2">Content Differences</h4>
              <div className="space-y-2">
                {Object.entries(details.differences.compare_result.differences).map(([key, diff], index) => (
                  <div key={index} className="bg-gray-800 rounded p-3">
                    <p className="text-sm text-gray-400 mb-2">{key}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Document</p>
                        <p className="text-white">{diff.docx}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">OCR Result</p>
                        <p className="text-white">{getHighlightedText(diff.docx, diff.ocr)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

VerificationDetails.displayName = 'VerificationDetails';

export default VerificationDetails;
