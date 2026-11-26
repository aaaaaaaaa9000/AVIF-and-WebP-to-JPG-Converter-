
import React, { useState, useCallback, useRef } from 'react';
import JSZip from 'https://esm.sh/jszip';

const Spinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg text-slate-300">جاري التحويل...</p>
  </div>
);

interface AlertProps {
  message: string;
}
const Alert: React.FC<AlertProps> = ({ message }) => (
  <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative text-sm" role="alert">
    <strong className="font-bold">خطأ: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);


interface FileUploaderProps {
  onFileSelect: (files: FileList) => void;
  isConverting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}
const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isConverting, fileInputRef }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileSelect(event.target.files);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-6">
      <div 
        className={`w-full p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-sky-400 bg-sky-900/50' : 'border-slate-600 hover:border-slate-500'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/avif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={isConverting}
          multiple
        />
        <div className="flex flex-col items-center text-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-slate-300">
            اسحب وأفلت ملفات AVIF أو WebP هنا
          </p>
          <p className="text-slate-500">أو</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isConverting}
            className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            اختر ملفات
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500">يتم قبول ملفات .avif و .webp</p>
    </div>
  );
};

interface ConvertedFile {
  id: string;
  file: File;
  originalUrl: string;
  convertedUrl: string | null;
  status: 'converting' | 'done' | 'error';
  error: string | null;
}

const ImageCard: React.FC<{ fileData: ConvertedFile }> = ({ fileData }) => {
  const fileTypeLabel = fileData.file.type.includes('webp') ? 'WebP' : 'AVIF';

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col gap-4">
      <h3 className="text-md font-semibold text-slate-300 truncate" title={fileData.file.name}>
        {fileData.file.name}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2">
          <h4 className="text-sm text-slate-400">الأصل ({fileTypeLabel})</h4>
          <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-md bg-slate-900/50">
            <img src={fileData.originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h4 className="text-sm text-slate-400">النتيجة (JPG)</h4>
          <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-md bg-slate-900/50">
            {fileData.status === 'converting' && <Spinner />}
            {fileData.status === 'done' && fileData.convertedUrl && (
              <img src={fileData.convertedUrl} alt="Converted" className="max-w-full max-h-full object-contain" />
            )}
            {fileData.status === 'error' && fileData.error && <Alert message={fileData.error} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    files.forEach(f => {
      URL.revokeObjectURL(f.originalUrl);
      if (f.convertedUrl && f.convertedUrl.startsWith('blob:')) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
    setGlobalError(null);
    setIsConverting(false);
    setIsZipping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertFileToJpg = useCallback(async (inputFile: File, id: string) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(inputFile);

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'لا يمكن إنشاء سياق للرسم.' } : f));
            resolve();
            return;
          }
          ctx.drawImage(img, 0, 0);
          
          // Use blob for potentially better memory handling with ZIP
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done', convertedUrl: url } : f));
            } else {
               setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'فشل إنشاء الصورة.' } : f));
            }
            resolve();
          }, 'image/jpeg', 0.95);
        };

        img.onerror = () => {
          setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'فشل تحميل الصورة.' } : f));
          resolve();
        };
      };

      reader.onerror = () => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'فشل قراءة الملف.' } : f));
        resolve();
      };
    });
  }, []);

  const handleFileSelect = async (fileList: FileList) => {
    resetState();
    setGlobalError(null);
    
    const validFiles = Array.from(fileList).filter(file => {
      const type = file.type;
      const name = file.name.toLowerCase();
      if (type === 'image/avif' || type === 'image/webp' || name.endsWith('.avif') || name.endsWith('.webp')) return true;
      setGlobalError(prev => (prev ? prev + ", " : "") + `${file.name} ليس ملف AVIF أو WebP.`);
      return false;
    });

    if (validFiles.length === 0 && fileList.length > 0) {
       setGlobalError('لم يتم تحديد أي ملفات مدعومة (AVIF أو WebP).');
       return;
    }
    
    if (validFiles.length === 0) return;

    setIsConverting(true);

    const newFiles: ConvertedFile[] = validFiles.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      originalUrl: URL.createObjectURL(file),
      convertedUrl: null,
      status: 'converting',
      error: null,
    }));
    
    setFiles(newFiles);

    await Promise.all(newFiles.map(f => convertFileToJpg(f.file, f.id)));
    
    setIsConverting(false);
  };
  
  const handleDownloadAllAsZip = async () => {
    const convertedFiles = files.filter(f => f.status === 'done' && f.convertedUrl);
    if (convertedFiles.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      for (const f of convertedFiles) {
        // Fetch the blob content from the object URL
        const response = await fetch(f.convertedUrl!);
        const blob = await response.blob();
        
        // Sanitize file name: remove original extension and add .jpg
        const baseName = f.file.name.replace(/\.(avif|webp)$/i, '');
        const fileName = `${baseName}.jpg`;
        
        zip.file(fileName, blob);
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'converted_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      setGlobalError("حدث خطأ أثناء إنشاء ملف ZIP. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsZipping(false);
    }
  };
  
  const completedCount = files.filter(f => f.status === 'done').length;
  const canDownload = !isConverting && !isZipping && completedCount > 0;

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            محول AVIF و WebP إلى JPG
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            حوّل صورك من صيغة AVIF أو WebP إلى JPG بسهولة ومباشرة في متصفحك.
          </p>
        </header>

        <main className="w-full">
          {files.length === 0 && <FileUploader onFileSelect={handleFileSelect} isConverting={isConverting} fileInputRef={fileInputRef} />}

          {globalError && (
            <div className="my-6 max-w-lg mx-auto">
              <Alert message={globalError} />
            </div>
          )}

          {files.length > 0 && (
            <div className="w-full flex flex-col items-center gap-8">
               <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleDownloadAllAsZip}
                    disabled={!canDownload}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    {isZipping ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الضغط...
                      </>
                    ) : (
                      `تحميل الكل كملف ZIP (${completedCount})`
                    )}
                  </button>
                  <button
                    onClick={resetState}
                    disabled={isZipping}
                    className="px-8 py-3 bg-slate-700 text-slate-200 font-bold rounded-lg hover:bg-slate-600 transition-colors text-lg disabled:opacity-50"
                  >
                    البدء من جديد
                  </button>
                </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {files.map(fileData => (
                  <ImageCard key={fileData.id} fileData={fileData} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
