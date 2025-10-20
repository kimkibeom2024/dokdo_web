const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));

// 현재 가장 높은 번호 구하기 함수
function getNextFileNumber() {
    const files = fs.readdirSync('uploads/');
    const numbers = files
        .map(file => {
            const match = file.match(/^dokdonewspaper_(\d+)\.pdf$/);
            return match ? parseInt(match[1], 10) : null;
        })
        .filter(num => num !== null);
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return maxNumber + 1;
}

// multer 설정 → 파일 자동 번호 붙이기 저장
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const nextNumber = getNextFileNumber();
        const formattedNumber = String(nextNumber).padStart(3, '0');
        cb(null, `dokdonewspaper_${formattedNumber}.pdf`);
    }
});
const upload = multer({ storage: storage });

app.post('/send-email', upload.single('pdf'), async (req, res) => {
    const email = req.body.email;
    const pdfPath = req.file.path;

    try {
        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: '2530107@bsis.hs.kr',   // 너가 쓴 계정
                pass: 'fccu typr sadr iqdu'             // 너가 쓴 앱 비밀번호
            }
        });

        // 연결 확인용 (디버그 출력 가능, 원하면 주석 처리해도 됨)
        transporter.verify((error, success) => {
            if (error) {
                console.error('Email transporter 연결 오류:', error);
            } else {
                console.log('Email transporter 준비 완료:', success);
            }
        });

        const mailOptions = {
            from: '2530107@bsis.hs.kr',
            to: email,
            subject: '독도의용수비대 신문 PDF',
            text: '첨부된 PDF를 확인하세요.',
            attachments: [
                {
                    filename: path.basename(pdfPath),
                    path: pdfPath
                }
            ]
        };

        // 메일 전송 시도
        await transporter.sendMail(mailOptions);

        console.log(`이메일 전송 성공 → 받는 사람: ${email}`);

        // 성공 시 파일 삭제
        fs.unlink(pdfPath, (err) => {
            if (err) {
                console.error('파일 삭제 실패:', err);
            } else {
                console.log(`파일 삭제 완료: ${pdfPath}`);
            }
        });

        // 성공 응답 보내기
        res.json({ success: true, message: '이메일 전송 성공! 파일도 삭제되었습니다.', savedFile: path.basename(pdfPath) });

    } catch (error) {
        console.error('이메일 전송 오류:', error);

        // 실패 시 파일은 그대로 유지 (확인용)
        res.status(500).json({ success: false, message: '이메일 전송 실패. 파일은 유지됨.', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`서버 실행 중: http://localhost:${port}`);
});
