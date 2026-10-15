'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Camera, Keyboard, UploadSimple, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface QrScannerViewportProps {
  onScanSuccess: (scannedData: string) => void;
  onError?: (errorMessage: string) => void;
  initialSharedInput?: string;
}

export const QrScannerViewport: React.FC<QrScannerViewportProps> = ({
  onScanSuccess,
  onError,
  initialSharedInput = '',
}) => {
  const [manualKey, setManualKey] = useState(initialSharedInput);
  const [mode, setMode] = useState<'camera' | 'manual' | 'file'>(
    initialSharedInput ? 'manual' : 'camera'
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerRef = useRef<unknown | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (mode === 'camera') {
      import('html5-qrcode')
        .then(({ Html5QrcodeScanner }) => {
          if (!isMounted) return;

          try {
            const scanner = new Html5QrcodeScanner(
              'qr-reader',
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              false
            );

            scannerRef.current = scanner;

            scanner.render(
              (decodedText: string) => {
                queueMicrotask(() => {
                  onScanSuccess(decodedText);
                });
              },
              (errorMessage: string) => {
                if (errorMessage.includes('Camera')) {
                  queueMicrotask(() => {
                    setCameraError(errorMessage);
                    onError?.(errorMessage);
                  });
                }
              }
            );
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Falha ao iniciar câmera';
            queueMicrotask(() => {
              setCameraError(msg);
            });
          }
        })
        .catch(() => {
          queueMicrotask(() => {
            setCameraError('Biblioteca de leitura QR não carregada.');
          });
        });
    }

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          const sc = scannerRef.current as { clear: () => Promise<void> };
          sc.clear().catch(() => {});
        } catch {}
      }
    };
  }, [mode, onScanSuccess, onError]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualKey.trim();
    if (cleaned.length < 44 && !cleaned.startsWith('http')) {
      setCameraError('Chave deve ter 44 dígitos ou ser uma URL válida da SEFAZ.');
      return;
    }
    setCameraError(null);
    onScanSuccess(cleaned);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader-file');
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch {
      setCameraError('Não foi possível identificar o QR Code na imagem selecionada.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <Card variant="bordered" className="max-w-md mx-auto p-6 text-center">
      <div className="flex justify-center flex-wrap gap-2 mb-6">
        <Button
          type="button"
          variant={mode === 'camera' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            setCameraError(null);
            setMode('camera');
          }}
          className="gap-1.5"
        >
          <Camera size={16} weight="bold" />
          <span>Câmera QR</span>
        </Button>
        <Button
          type="button"
          variant={mode === 'manual' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            setCameraError(null);
            setMode('manual');
          }}
          className="gap-1.5"
        >
          <Keyboard size={16} weight="bold" />
          <span>Chave 44 dígitos</span>
        </Button>
        <Button
          type="button"
          variant={mode === 'file' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            setCameraError(null);
            setMode('file');
          }}
          className="gap-1.5"
        >
          <UploadSimple size={16} weight="bold" />
          <span>Foto / Arquivo</span>
        </Button>
      </div>

      {mode === 'camera' && (
        <div>
          <div
            id="qr-reader"
            className="w-full min-h-[300px] rounded-md overflow-hidden bg-surface-soft border border-hairline flex items-center justify-center"
          />
          {cameraError && (
            <div className="mt-4 p-3 rounded-sm bg-surface-soft border border-hairline flex items-center gap-2 text-error text-[13px] text-left">
              <WarningCircle size={18} weight="bold" className="shrink-0" />
              <span>{cameraError}. Tente digitar a chave de acesso.</span>
            </div>
          )}
          <p className="text-[14px] text-muted mt-4">
            Aponte a câmera para o QR Code impresso no cupom fiscal (NFC-e).
          </p>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4 text-left">
          <Input
            label="Chave de Acesso (44 dígitos) ou URL"
            placeholder="Ex: 422409... ou https://sat.sef.sc.gov.br/..."
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
            error={cameraError ?? undefined}
          />

          <Button type="submit" variant="primary" className="w-full gap-2">
            <CheckCircle size={18} weight="bold" />
            <span>Processar Cupom Fiscal</span>
          </Button>

          <p className="text-[13px] text-muted text-center">
            A chave de acesso com 44 números está localizada logo abaixo do cabeçalho da sua nota fiscal.
          </p>
        </form>
      )}

      {mode === 'file' && (
        <div className="space-y-4 text-center">
          <div id="qr-reader-file" className="hidden" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[200px] border-2 border-dashed border-hairline-strong rounded-md flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-surface-soft transition-colors"
          >
            <UploadSimple size={36} weight="bold" className="text-muted mb-2" />
            <p className="text-[14px] font-semibold text-ink">
              Clique para selecionar uma foto ou arquivo
            </p>
            <p className="text-[12px] text-muted mt-1">
              PNG, JPG ou foto direta do cupom fiscal
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {isProcessingFile && (
            <p className="text-[14px] font-medium text-ink">
              Analisando imagem e decodificando QR Code...
            </p>
          )}

          {cameraError && (
            <div className="p-3 rounded-sm bg-surface-soft border border-hairline flex items-center gap-2 text-error text-[13px] text-left">
              <WarningCircle size={18} weight="bold" className="shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
