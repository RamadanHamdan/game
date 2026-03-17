import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const saveAsXLSX = async (wb, filename) => {
    try {
        if (!XLSX || !Capacitor) return;

        const isNative = Capacitor.isNativePlatform();

        const runWebDownload = () => {
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 2000);
        };

        if (isNative) {
            try {
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                const result = await Filesystem.writeFile({
                    path: filename,
                    data: wbout,
                    directory: Directory.Documents,
                });

                alert(`File berhasil disimpan ke folder Documents di perangkat Anda: ${filename}`);

                try {
                    await Share.share({
                        title: filename,
                        url: result.uri,
                    });
                } catch (shareErr) {
                    console.log('Share dismissed or not supported', shareErr);
                }
            } catch (nativeErr) {
                console.error('Native Path Failed:', nativeErr);
                // Fallback to web download if native sharing fails
                runWebDownload();
            }
        } else {
            runWebDownload();
        }
    } catch (err) {
        console.error('Excel Download Error:', err);
    }
};
