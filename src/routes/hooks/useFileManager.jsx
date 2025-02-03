import React, { useState, useEffect } from 'react';

const useFileManager = () => {
  const [selectedFiles, setSelectedFiles] = useState({
    docx: {
      file: null,
      fileName: '',
      type: 'docx'
    },
    pdf: {
      file: null,
      fileName: '',
      type: 'pdf'
    },
    image: {
      file: null,
      fileName: '',
      type: 'image',
      scope: {
        cropX: 0,
        cropY: 0,
        cropWidth: 0,
        cropHeight: 0
      }
    }
  });

  // Log state changes whenever selectedFiles updates
  useEffect(() => {
    const logState = {
      docx: {
        fileName: selectedFiles.docx.fileName,
      },
      pdf: {
        fileName: selectedFiles.pdf.fileName,
      },
      image: {
        fileName: selectedFiles.image.fileName,
        scope: {
          cropX: selectedFiles.image.scope.cropX,
          cropY: selectedFiles.image.scope.cropY,
          cropWidth: selectedFiles.image.scope.cropWidth,
          cropHeight: selectedFiles.image.scope.cropHeight
        }
      }
    };
    console.log('Selected Files Updated:', logState);
  }, [selectedFiles]);

  // Update document files (PDF or DOCX)
  const updateDocumentFile = (file, fileName, type) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        file: file,
        fileName: fileName
      }
    }));
  };

  // Update image file and scope
  const updateImageFile = (file, fileName, scope = null) => {
    setSelectedFiles(prev => ({
      ...prev,
      image: {
        ...prev.image,
        file: file,
        fileName: fileName,
        scope: scope || prev.image.scope
      }
    }));
  };

  // Update image scope only
  const updateImageScope = (scope) => {
    setSelectedFiles(prev => ({
      ...prev,
      image: {
        ...prev.image,
        scope: {
          cropX: scope.x,
          cropY: scope.y,
          cropWidth: scope.width,
          cropHeight: scope.height
        }
      }
    }));
  };

  // Clear specific file
  const clearFile = (type) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        file: null,
        fileName: '',
        ...(type === 'image' && {
          scope: {
            cropX: 0,
            cropY: 0,
            cropWidth: 0,
            cropHeight: 0
          }
        })
      }
    }));
  };

  // Clear all files
  const clearAllFiles = () => {
    setSelectedFiles({
      docx: {
        file: null,
        fileName: '',
        type: 'docx'
      },
      pdf: {
        file: null,
        fileName: '',
        type: 'pdf'
      },
      image: {
        file: null,
        fileName: '',
        type: 'image',
        scope: {
          cropX: 0,
          cropY: 0,
          cropWidth: 0,
          cropHeight: 0
        }
      }
    });
  };

  // Load files from existing verification (unchanged)
  const loadExistingFiles = async (verificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://162.38.2.150:8100/verifications/${verificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch verification details');

      const data = await response.json();

      // Clear existing files first
      clearAllFiles();

      // Load DOCX if exists
      if (data.docx_info?.exists) {
        const docxResponse = await fetch(
          `http://162.38.2.150:8100/verifications/${verificationId}/docx`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (docxResponse.ok) {
          const docxBlob = await docxResponse.blob();
          const docxFile = new File([docxBlob], data.docx_info.filename || 'document.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          updateDocumentFile(docxFile, data.docx_info.filename, 'docx');
        }
      }

      // Load PDF if exists
      if (data.pdf_info?.exists) {
        const pdfResponse = await fetch(
          `http://162.38.2.150:8100/verifications/${verificationId}/pdf`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          const pdfFile = new File([pdfBlob], 'document.pdf', {
            type: 'application/pdf'
          });
          updateDocumentFile(pdfFile, 'document.pdf', 'pdf');
        }
      }

      // Load image if exists
      if (data.image_info?.exists) {
        const imageResponse = await fetch(
          `http://162.38.2.150:8100/verifications/${verificationId}/image`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], data.image_info.filename || 'image.png', {
            type: 'image/*'
          });
          
          let scope = null;
          if (data.image_info.ocr_scope) {
            const [cropX, cropY, cropWidth, cropHeight] = data.image_info.ocr_scope
              .replace(/[\[\]]/g, '')
              .split(',')
              .map(val => parseFloat(val.trim()));
            
            scope = { cropX, cropY, cropWidth, cropHeight };
          }
          
          updateImageFile(imageFile, data.image_info.filename, scope);
        }
      }

    } catch (error) {
      console.error('Error loading existing files:', error);
      throw error;
    }
  };

  return {
    selectedFiles,
    updateDocumentFile,
    updateImageFile,
    updateImageScope,
    clearFile,
    clearAllFiles,
    loadExistingFiles
  };
};

export default useFileManager;