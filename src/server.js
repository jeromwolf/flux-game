import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3100;

app.use(express.static(join(__dirname, '../public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🎮 Flux Game 서버가 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`http://localhost:${PORT} 에서 게임을 즐기세요!`);
});