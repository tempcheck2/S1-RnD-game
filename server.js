const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const TIME_LIMIT_MS = 15 * 60 * 1000; // 15분

const CODE_TEXTS = {
    1: `// 1번 C 언어
#include <stdio.h>
#include <stdbool.h>

#define MAX_USERS 100
bool is_inside[MAX_USERS] = {false};

void process_card_tag(int user_id, bool is_entry) {
    if (user_id <= 0 || user_id > MAX_USERS) return;
    
    if (is_entry) {
        if (is_inside[user_id]) {
            printf("[ALARM] APB Violation! User %d is already inside.\\n", user_id);
            return;
        }
        is_inside[user_id] = true;
        printf("[INFO] Entry Granted. Door Opened for User %d.\\n", user_id);
    } else {
        if (!is_inside[user_id]) {
            printf("[ALARM] APB Violation! User %d is not inside.\\n", user_id);
            return;
        }
        is_inside[user_id] = false;
        printf("[INFO] Exit Granted. Door Opened for User %d.\\n", user_id);
    }
}

int main() {
    printf("[SYSTEM] APB Manager Initialized.\\n");
    process_card_tag(10, true);
    process_card_tag(10, true);  // APB Error Trigger
    process_card_tag(10, false);
    return 0;
}`,
    2: `// 2번 C++
#include <iostream>
#include <string>
#include <chrono>

class DualAuthDoor {
private:
    std::string first_card_id;
    long long first_tag_time;
    const int AUTH_TIMEOUT_MS = 5000;

    long long current_time_ms() {
        auto now = std::chrono::system_clock::now();
        return std::chrono::duration_cast<std::chrono::milliseconds>
               (now.time_since_epoch()).count();
    }

public:
    DualAuthDoor() : first_card_id(""), first_tag_time(0) {}

    void tag_card(const std::string& card_id) {
        long long now = current_time_ms();

        if (first_card_id.empty()) {
            first_card_id = card_id;
            first_tag_time = now;
            std::cout << "[INFO] First card tagged. Waiting for second card...\\n";
            return;
        }

        if (now - first_tag_time > AUTH_TIMEOUT_MS) {
            std::cout << "[TIMEOUT] Auth window expired. Resetting state.\\n";
            first_card_id = card_id;
            first_tag_time = now;
            return;
        }

        if (first_card_id == card_id) {
            std::cout << "[ERROR] Cannot use the same card twice!\\n";
        } else {
            std::cout << "[SUCCESS] Dual authentication complete. Door unlocked!\\n";
            first_card_id = "";
            first_tag_time = 0;
        }
    }
};

int main() {
    DualAuthDoor lab_door;
    lab_door.tag_card("EMP_4021");
    lab_door.tag_card("MGR_9901");
    return 0;
}`,
    3: `// 3번 Java
import java.util.HashMap;
import java.util.Map;

public class AccessController {
    private final Map<String, String> userLocations;
    private final boolean isApbEnabled;

    public AccessController(boolean enforceApb) {
        this.userLocations = new HashMap<>();
        this.isApbEnabled = enforceApb;
        System.out.println("[INIT] Access Controller started. APB: " + enforceApb);
    }

    public synchronized void requestAccess(String empId, String targetZone) {
        String currentLocation = userLocations.getOrDefault(empId, "OUTSIDE");

        if (isApbEnabled && currentLocation.equals(targetZone)) {
            System.out.println("[REJECT] " + empId + " APB Rule Triggered.");
            triggerSiren(empId);
            return;
        }

        if (!checkClearance(empId, targetZone)) {
            System.out.println("[DENIED] " + empId + " lacks clearance for " + targetZone);
            return;
        }

        userLocations.put(empId, targetZone);
        System.out.println("[GRANTED] Door opened. " + empId + " entered " + targetZone);
    }

    private boolean checkClearance(String empId, String zone) {
        return empId.startsWith("SEC_") || zone.equals("LOBBY");
    }

    private void triggerSiren(String empId) {
        System.err.println("[ALERT] Security team dispatched for ID: " + empId);
    }

    public static void main(String[] args) {
        AccessController ac = new AccessController(true);
        ac.requestAccess("SEC_1004", "SERVER_ROOM");
        ac.requestAccess("SEC_1004", "SERVER_ROOM"); // Trigger APB
    }
}`,
    4: `# 4번 Python
import time
from datetime import datetime

def audit_logger(func):
    def wrapper(user_id, door_id, *args, **kwargs):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] TAG EVENT: {user_id} at {door_id}")
        result = func(user_id, door_id, *args, **kwargs)
        status = "OPENED" if result else "LOCKED"
        print(f"[{timestamp}] DOOR STATUS: {status}")
        return result
    return wrapper

class SecurityZone:
    def __init__(self, zone_name, requires_2fa=False):
        self.zone = zone_name
        self.requires_2fa = requires_2fa
        self.auth_cache = []

    @audit_logger
    def swipe_card(self, user_id, door_id):
        if not self.requires_2fa:
            return True
            
        if user_id not in self.auth_cache:
            self.auth_cache.append(user_id)
            print("[SYSTEM] 1/2 Authentication stored. Waiting...")
            return False
            
        self.auth_cache.remove(user_id)
        print("[SYSTEM] 2/2 Authentication successful.")
        return True

if __name__ == "__main__":
    print("--- R&D Center Security Initialized ---")
    main_gate = SecurityZone("MAIN_GATE", requires_2fa=False)
    lab_door = SecurityZone("RD_LAB_A", requires_2fa=True)
    
    main_gate.swipe_card("EMP_882", "G-01")
    lab_door.swipe_card("EMP_882", "L-01")
    lab_door.swipe_card("MGR_001", "L-01")
`,
    5: `// 5번 JavaScript
class DoorController {
    constructor(doorId, strictMode = true) {
        this.doorId = doorId;
        this.strictMode = strictMode;
        this.occupants = new Set();
    }

    async processTagEvent(cardId, direction) {
        console.log(\`[TAG] Card: \${cardId} | Dir: \${direction}\`);
        
        try {
            await this.verifyCredentials(cardId);
            this.checkAntiPassback(cardId, direction);
            this.executeRelay(direction);
        } catch (error) {
            console.error(\`[ACCESS DENIED] \${error.message}\`);
        }
    }

    verifyCredentials(cardId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (cardId.includes("REVOKED")) reject(new Error("Invalid Card"));
                else resolve(true);
            }, 200);
        });
    }

    checkAntiPassback(cardId, dir) {
        if (this.strictMode) {
            const isInside = this.occupants.has(cardId);
            if (dir === 'IN' && isInside) throw new Error("APB Error: Already Inside");
            if (dir === 'OUT' && !isInside) throw new Error("APB Error: Not Inside");
        }
        
        dir === 'IN' ? this.occupants.add(cardId) : this.occupants.delete(cardId);
    }

    executeRelay(dir) {
        console.log(\`[DOOR \${this.doorId}] Relay activated. Door is OPEN (\${dir}).\`);
    }
}

const labEntrance = new DoorController("LAB_01");
labEntrance.processTagEvent("USER_99", "IN");
`
};

const rooms = {};

function calculateFinalRanks(room) {
    room.gameEnded = true;
    const playersArr = Object.values(room.players);
    
    const finished = playersArr.filter(p => p.progress >= 100).sort((a, b) => a.rank - b.rank);
    const unranked = playersArr.filter(p => p.progress < 100).sort((a, b) => b.progress - a.progress);
    
    let currentRankOffset = finished.length;
    let prevProgress = -1;
    let sameRank = currentRankOffset + 1;

    unranked.forEach((p, index) => {
        if (p.progress === prevProgress) {
            p.rank = sameRank;
        } else {
            sameRank = currentRankOffset + index + 1;
            p.rank = sameRank;
        }
        prevProgress = p.progress;
        p.isFinished = true;
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
                const finishedCount = playersArr.filter(p => p.progress >= 100).length;
                const allFinished = playersArr.length > 0 && finishedCount === playersArr.length;
                
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
    console.log(`[서버 가동 성공] 5개국어 및 출입 보안 시스템 코드 업데이트 완료! 포트: ${PORT}`);
});
