const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const TIME_LIMIT_MS = 15 * 60 * 1000; // 15분

const CODE_TEXTS = {
    1: `// 1번: C 언어
#include <stdio.h>
#include <stdbool.h>

typedef enum {
    STATE_LOCKED,
    STATE_UNLOCKED,
    STATE_ALARM
} DoorState;

typedef enum {
    EVENT_CARD_TAP,
    EVENT_TIMEOUT,
    EVENT_FORCE_OPEN
} DoorEvent;

DoorState current_state = STATE_LOCKED;
int access_count = 0;

void handle_door_event(DoorEvent event) {
    switch (current_state) {
        case STATE_LOCKED:
            if (event == EVENT_CARD_TAP) {
                current_state = STATE_UNLOCKED;
                access_count++;
                printf("[INFO] Access Granted. Door unlocked.\\n");
            } else if (event == EVENT_FORCE_OPEN) {
                current_state = STATE_ALARM;
                printf("[WARN] EMERGENCY! Intrusion detected!\\n");
            }
            break;
        case STATE_UNLOCKED:
            if (event == EVENT_TIMEOUT) {
                current_state = STATE_LOCKED;
                printf("[INFO] Timeout reached. Door locked automatically.\\n");
            }
            break;
        case STATE_ALARM:
            printf("[CRITICAL] Alarm is active. System override required.\\n");
            break;
    }
}

int main() {
    printf("===== Security System Initialization =====\\n");
    handle_door_event(EVENT_CARD_TAP);
    handle_door_event(EVENT_TIMEOUT);
    handle_door_event(EVENT_FORCE_OPEN);
    printf("[STATUS] Total successful access: %d\\n", access_count);
    printf("===== System Terminated Successfully =====\\n");
    return 0;
}`,
    2: `// 2번: C++

}`,
    3: `// 3번: Java
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CacheManager {
    private static CacheManager instance;
    private final Map<String, String> sessionStore;

    private CacheManager() {
        sessionStore = new ConcurrentHashMap<>();
        System.out.println("[KERNEL] Session storage container allocated.");
    }

    public static synchronized CacheManager getInstance() {
        if (instance == null) {
            instance = new CacheManager();
            System.out.println("[KERNEL] Singleton instance created successfully.");
        }
        return instance;
    }

    public void setSession(String token, String userInfo) {
        sessionStore.put(token, userInfo);
    }

    public String getSession(String token) {
        return sessionStore.getOrDefault(token, "EXPIRED_OR_INVALID");
    }

    public static void main(String[] args) {
        System.out.println("====== Enterprise Runtime Environment ======");
        CacheManager manager = CacheManager.getInstance();
        
        manager.setSession("AUTH_TK_9921", "User: admin, Role: super");
        String result = manager.getSession("AUTH_TK_9921");
        
        System.out.println("[RUNTIME] Fetched token state: " + result);
        System.out.println("====== Server Context Destroyed ======");
    }
}`,
    4: `# 4번: Python
import time
from functools import wraps

def monitor_execution_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        response = func(*args, **kwargs)
        end_time = time.perf_counter()
        print(f"[METRIC] {func.__name__} took {end_time - start_time:.6f} seconds")
        return response
    return wrapper

def data_stream_generator(max_limit):
    current_payload = 1
    while current_payload <= max_limit:
        yield f"Chunk-{current_payload:03d}"
        current_payload += 1

@monitor_execution_time
def execute_data_pipeline():
    print("[PIPELINE] Initializing high-throughput data stream...")
    active_stream = data_stream_generator(5)
    
    for payload in active_stream:
        print(f"[PROCESS] Ingesting segment: {payload}")
        time.sleep(0.15)
    
    print("[PIPELINE] Data stream parsing completed.")

if __name__ == "__main__":
    print("================ Core Service Engine ================")
    execute_data_pipeline()
    print("================ Process Finished ================")
`
};

const rooms = {};

// 최종 순위 및 공동 등수 집계 함수
function calculateFinalRanks(room) {
    room.gameEnded = true;
    const playersArr = Object.values(room.players);
    
    // 1. 이미 100%를 달성하여 선착순으로 순위가 매겨진 인원들
    const finished = playersArr.filter(p => p.progress >= 100).sort((a, b) => a.rank - b.rank);
    
    // 2. 시간 종료/강제 종료/3등 마감으로 100% 미만인 인원들 (진행률 기준 내림차순 정렬)
    const unranked = playersArr.filter(p => p.progress < 100).sort((a, b) => b.progress - a.progress);
    
    let currentRankOffset = finished.length;
    let prevProgress = -1;
    let sameRank = currentRankOffset + 1;

    // 공동 등수 처리 로직 (예: 1등, 1등, 3등)
    unranked.forEach((p, index) => {
        if (p.progress === prevProgress) {
            p.rank = sameRank; // 진행률이 같으면 동일한 등수 부여
        } else {
            sameRank = currentRankOffset + index + 1;
            p.rank = sameRank;
        }
        prevProgress = p.progress;
        p.isFinished = true; // 최종 집계를 위해 모두 완료 상태로 변경
    });
}

const server = http.createServer((req, res) => {
    const host = req.headers.host || 'localhost';
    const urlObj = new URL(req.url, `http://${host}`);
    const pathname = urlObj.pathname;

    if (pathname === '/' || pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500); return res.end('Error loading index.html');
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
        });
        return;
    }

    if (pathname === '/api/status' && req.method === 'GET') {
        const roomId = urlObj.searchParams.get('room');
        const room = rooms[roomId];
        
        if (room) {
            if (room.gameStarted && !room.gameEnded) {
                const timePassed = Date.now() - room.startTime;
                room.timeLeft = Math.max(0, TIME_LIMIT_MS - timePassed);
                
                const playersArr = Object.values(room.players);
                
                // [신규 로직] 100% 완료한 사람(결승선 통과자) 수 계산
                const finishedCount = playersArr.filter(p => p.progress >= 100).length;
                
                // 전원 완료했는지 여부
                const allFinished = playersArr.length > 0 && finishedCount === playersArr.length;
                
                // 15분 경과 OR 전원 완료 OR [3명 이상 결승선 통과] 시 게임 자동 종료
                if (room.timeLeft <= 0 || allFinished || finishedCount >= 3) {
                    calculateFinalRanks(room);
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(room));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'No room found' }));
        }
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { roomId, playerId, action } = payload;

                if (pathname === '/api/join') {
                    if (!rooms[roomId]) {
                        rooms[roomId] = {
                            host: playerId, players: {}, gameStarted: false, gameEnded: false,
                            selectedLang: 1, text: CODE_TEXTS[1], startTime: null, timeLeft: TIME_LIMIT_MS
                        };
                    }
                    rooms[roomId].players[playerId] = {
                        name: payload.name, progress: 0, wpm: 0, isFinished: false, rank: null
                    };
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                    return;
                }

                if (pathname === '/api/control') {
                    const room = rooms[roomId];
                    if (room && room.host === playerId) {
                        if (action === 'change_lang') {
                            room.selectedLang = payload.langId;
                            room.text = CODE_TEXTS[payload.langId];
                        } else if (action === 'start') {
                            room.gameStarted = true;
                            room.gameEnded = false;
                            room.startTime = Date.now();
                            room.timeLeft = TIME_LIMIT_MS;
                            for (let id in room.players) {
                                room.players[id].progress = 0; room.players[id].wpm = 0;
                                room.players[id].isFinished = false; room.players[id].rank = null;
                            }
                        } else if (action === 'force_stop') {
                            calculateFinalRanks(room);
                        }
                    }
                    res.writeHead(200); res.end(); return;
                }

                if (pathname === '/api/progress') {
                    const room = rooms[roomId];
                    if (room && room.players[playerId] && room.gameStarted && !room.gameEnded) {
                        const player = room.players[playerId];
                        if (!player.isFinished) {
                            player.progress = payload.progress;
                            player.wpm = payload.wpm;
                            
                            if (payload.progress >= 100) {
                                player.isFinished = true;
                                player.rank = Object.values(room.players).filter(p => p.isFinished).length;
                            }
                        }
                    }
                    res.writeHead(200); res.end(); return;
                }
            } catch (e) { res.writeHead(400); res.end(); }
        });
        return;
    }
    res.writeHead(404); res.end();
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[서버 가동 성공] 3등 선착순 컷오프 기능 적용 완료! 포트: ${PORT}`);
});