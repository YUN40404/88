const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const auth = require('express-basic-auth');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN || '';

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname));

const db = new sqlite3.Database('./data.db');
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, notice TEXT, price_cz TEXT, price_hgh TEXT)");
    db.run("ALTER TABLE settings ADD COLUMN price_hgh TEXT;", (err) => {});
    db.run("CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, title TEXT, category TEXT, display_location TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, contact TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    db.run("CREATE TABLE IF NOT EXISTS portal_config (id INTEGER PRIMARY KEY, data TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS bookings_v3 (id INTEGER PRIMARY KEY AUTOINCREMENT, wechat TEXT, cn TEXT, character TEXT, event_name TEXT, date TEXT, time TEXT, deposit TEXT, quantity INTEGER, remarks TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

    db.get("SELECT count(*) as count FROM portal_config", (err, row) => {
        if (row && row.count === 0) {
            const defaultData = JSON.stringify({ 
                notice: "欢迎使用自助预约系统", 
                dates: "2026-05-01,2026-05-02", 
                times: "10:00-12:00,14:00-16:00", 
                slot_capacity: 1, 
                price_cz: 80,
                price_hgh: 180,
                price_options: "石家庄场照(4张)|80\n沪广杭场照(4张)|180",
                invite_code: "zero2026", 
                pay_qr: "",
                events: [{name: '五一漫展专属企划', dates: '5月1日,5月2日', times: '10:00-12:00,14:00-16:00'}] 
            });
            db.run("INSERT INTO portal_config (id, data) VALUES (1, ?)", [defaultData]);
        }
    });
});

const adminAuth = auth({ users: { [ADMIN_USER]: ADMIN_PASSWORD }, challenge: true, realm: 'ZERO STUDIO ADMIN' });
app.get('/api/settings', (req, res) => {
    db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
        if (!row) {
            res.json({notice: '', price_cz: 80, price_hgh: 180});
        } else {
            res.json({
                notice: row.notice || '',
                price_cz: row.price_cz || 80,
                price_hgh: row.price_hgh || 180
            });
        }
    });
});
app.post('/api/settings', adminAuth, (req, res) => {
    const { notice, price_cz, price_hgh } = req.body;
    db.run("INSERT OR REPLACE INTO settings (id, notice, price_cz, price_hgh) VALUES (1, ?, ?, ?)", [notice, price_cz, price_hgh], () => res.json({status: 'ok'}));
});

app.get('/api/portal_settings', (req, res) => {
    db.get("SELECT data FROM portal_config WHERE id = 1", (err, row) => {
        if (row && row.data) res.json(JSON.parse(row.data));
        else res.json({notice: '', invite_code: '', pay_qr: '', events: []});
    });
});
app.post('/api/portal_settings', adminAuth, (req, res) => {
    db.run("INSERT OR REPLACE INTO portal_config (id, data) VALUES (1, ?)", [JSON.stringify(req.body)], () => res.json({status: 'ok'}));
});

app.get('/api/photos', (req, res) => db.all("SELECT * FROM photos ORDER BY id DESC", (err, rows) => res.json(rows)));
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', adminAuth, upload.single('photo'), (req, res) => {
    const url = `/uploads/${req.file.filename}`;
    const { title, category, display_location } = req.body;
    db.run("INSERT INTO photos (url, title, category, display_location) VALUES (?, ?, ?, ?)", [url, title, category, display_location], () => res.redirect('/admin.html'));
});
app.post('/api/photos/delete', adminAuth, (req, res) => {
    db.get("SELECT url FROM photos WHERE id = ?", [req.body.id], (err, row) => {
        if (row) fs.unlink(path.join(__dirname, 'uploads', path.basename(row.url)), () => {});
        db.run("DELETE FROM photos WHERE id = ?", [req.body.id], () => res.json({ status: 'ok' }));
    });
});

app.get('/api/booked-times', (req, res) => {
    db.get("SELECT data FROM portal_config LIMIT 1", (err, configRow) => {
        let capacity = 1;
        if (configRow && configRow.data) {
            try {
                const config = JSON.parse(configRow.data);
                capacity = parseInt(config.slot_capacity) || 1;
            } catch (e) {}
        }
        
        db.all("SELECT date, time FROM bookings_v3", (err, rows) => {
            if (err) return res.json([]);
            
            let timeCounts = {};
            
            rows.forEach(row => {
                if (!row.date || !row.time) return;
                let times = row.time.split(',').map(t => t.trim());
                times.forEach(t => {
                    let key = `${row.date}_${t}`;
                    timeCounts[key] = (timeCounts[key] || 0) + 1;
                });
            });
            
            let fullSlots = [];
            for (let key in timeCounts) {
                if (timeCounts[key] >= capacity) {
                    let [date, time] = key.split('_');
                    fullSlots.push({ date, time });
                }
            }
            
            res.json(fullSlots);
        });
    });
});

// 【核心修复】防弹版锁档接口，彻底杜绝 null
app.post('/api/save-schedule', (req, res) => {
    const { wechat, cn, character, event_name, date, times, time, deposit, quantity, remarks, invite_code } = req.body;
    
    db.get("SELECT data FROM portal_config WHERE id = 1", (err, configRow) => {
        const config = configRow && configRow.data ? JSON.parse(configRow.data) : {};
        if (config.invite_code && invite_code !== config.invite_code) {
            return res.status(400).json({ status: 'error', message: '❌ 预约口令错误！请私聊摄影师获取。' });
        }

        let capacity = 1;
        if (configRow && configRow.data) {
            try {
                capacity = parseInt(config.slot_capacity) || 1;
            } catch (e) {}
        }

        let finalTimeStr = "";
        if (times && Array.isArray(times) && times.length > 0) {
            finalTimeStr = times.join(', ');
        } else if (time && typeof time === 'string') {
            finalTimeStr = time;
        } else {
            return res.status(400).json({ status: 'error', message: '❌ 必须选择至少一个时间段！请刷新重试。' });
        }

        db.all("SELECT time FROM bookings_v3 WHERE date = ?", [date], (err, rows) => {
            let timeCounts = {};
            if(rows) {
                rows.forEach(r => { 
                    if(r.time) {
                        r.time.split(',').forEach(t => {
                            let trimmed = t.trim();
                            timeCounts[trimmed] = (timeCounts[trimmed] || 0) + 1;
                        });
                    }
                });
            }
            
            if (times && Array.isArray(times)) {
                for (let t of times) {
                    if (timeCounts[t] >= capacity) {
                        return res.status(400).json({ status: 'error', message: '❌ 部分时间段已被抢空，请重新选择' });
                    }
                }
            }

            db.run("INSERT INTO bookings_v3 (wechat, cn, character, event_name, date, time, deposit, quantity, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                [wechat, cn, character, event_name, date, finalTimeStr, deposit, quantity, remarks], function(err) {
                if (err) return res.status(500).json({ error: err.message });

                if (PUSHPLUS_TOKEN) {
                    const title = encodeURIComponent('🚨 新档期锁定！');
                    const body = encodeURIComponent(`CN: ${cn}\n角色: ${character}\n微信: ${wechat}\n活动: ${event_name}\n时间: ${date} ${finalTimeStr}\n定金: ${deposit}\n数量: ${quantity}张\n备注: ${remarks || '无'}`);
                    https.get(`https://www.pushplus.plus/send?token=${PUSHPLUS_TOKEN}&title=${title}&content=${body}`).on("error", () => {});
                }
                res.json({ status: 'ok', pay_qr: config.pay_qr });
            });
        });
    });
});

app.get('/api/bookings', adminAuth, (req, res) => db.all("SELECT * FROM bookings_v3 ORDER BY id DESC", (err, rows) => res.json(rows || [])));
app.post('/api/bookings/delete', adminAuth, (req, res) => db.run("DELETE FROM bookings_v3 WHERE id = ?", [req.body.id], () => res.json({ status: 'ok' })));
app.post('/api/bookings/edit', adminAuth, (req, res) => {
    const { id, wechat, cn, character, date, time, deposit, quantity, remarks } = req.body;
    db.run("UPDATE bookings_v3 SET wechat=?, cn=?, character=?, date=?, time=?, deposit=?, quantity=?, remarks=? WHERE id=?", 
        [wechat, cn, character, date, time, deposit, quantity, remarks, id], () => res.json({ status: 'ok' }));
});

app.post('/api/messages', (req, res) => {
    const { name, contact, content } = req.body;
    db.run("INSERT INTO messages (name, contact, content) VALUES (?, ?, ?)", [name, contact, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (PUSHPLUS_TOKEN) {
            const title = encodeURIComponent('💬 网页咨询留言');
            const body = encodeURIComponent(`称呼: ${name}\n联系: ${contact}\n内容: ${content}`);
            https.get(`https://www.pushplus.plus/send?token=${PUSHPLUS_TOKEN}&title=${title}&content=${body}`).on("error", () => {});
        }
        res.json({ status: 'ok' });
    });
});
app.get('/api/messages', adminAuth, (req, res) => db.all("SELECT * FROM messages ORDER BY id DESC", (err, rows) => res.json(rows || [])));

app.listen(PORT, () => console.log(`Node Server is running on http://localhost:${PORT}`));