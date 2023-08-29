const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
//テンプレートファイルのディレクトリを設定
app.set('views', path.join(__dirname, 'views')); 

//ejsテンプレートの設定
app.set('view engine', 'ejs');

//URL エンコードされたボディのパース
app.use(express.urlencoded({ extended: true })); 

// 静的ファイルを提供するためのミドルウェア
app.use(express.static('public'));

//データベースを行う関数
function openDatabaseConnection() {
    return new sqlite3.Database('participant.db');
}

const createTableSankasyaQuery = `
    CREATE TABLE IF NOT EXISTS Sankasya (
        "ID"	INTEGER NOT NULL,
        "DiscordName" TEXT NOT NULL,
        "twitterId"	TEXT NOT NULL,
        "gameName"	TEXT NOT NULL,
        "ishost"	TEXT,
        PRIMARY KEY("ID" AUTOINCREMENT)
    )
`;

const createTableNextQuery = `
    CREATE TABLE IF NOT EXISTS Date (
        "ID"	INTEGER NOT NULL,
        "MONTH"  INTEGER NOT NULL,
        "DAY"  INTEGER NOT NULL,
        "TIME"  TEXT NOT NULL,
        PRIMARY KEY("ID" AUTOINCREMENT)
    )
`;

const db = openDatabaseConnection();

//テーブルの作成
db.run(createTableSankasyaQuery, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('参加者テーブルが作成されました。');
    }
    db.close();
});

const Db = openDatabaseConnection();

Db.run(createTableNextQuery, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('開催日テーブルが作成されました。');
    }
    Db.close();
});

//index.ejsの表示
app.get('/index', (req, res) => {
    const Db = openDatabaseConnection();
    Db.all('SELECT * FROM Date ORDER BY ID DESC LIMIT 1', (error, results) => {
        if(error){
            console.log(error.message);
        } else {
            res.render('index', {results});
        }
        Db.close();
    });
});

//insert.ejsの表示
app.get('/insert', (req, res) => {
    const db = openDatabaseConnection();
    db.all('SELECT COUNT(*) AS count FROM Sankasya', (error, results) => {
        if(error) {
            console.log(error.message);
        } 
        //人数の上限を設定
        const limit = 28; 
        const count = results[0].count;
        //人数の確認
        if(count > limit-1) {
            //人数オーバー
            res.render('over');
            db.close();
        } else {
            res.render('insert', {errors: []});
            db.close();
        }
    });
});

//入力フォームの登録
app.post('/insert',
(req, res, next) => {
    //入力チェック
    const DiscordName = req.body.DiscordName;
    const twitterId = req.body.twitterId;
    const gameName = req.body.gameName;
    const insertErrors = [];

    if(DiscordName === '') {
        insertErrors.push('discodeでの名前');
    }

    if(twitterId === '') {
        insertErrors.push('TwitterId');
    }

    if(gameName === '') {
        insertErrors.push('スプラトゥーンでの名前');
    }

    if(insertErrors.length > 0) {
        //エラーがあった場合
        res.render('insert', {errors:insertErrors});
    } else {
        next();
    }
},
(req, res) => {
    const DiscordName = req.body.DiscordName;
    const twitterId = req.body.twitterId;
    const gameName = req.body.gameName;
    const ishost = req.body.ishost;
    const dbIshost = ishost === '1' ? 'OK' : 'NG'; //データベースに入れる値
    const db = openDatabaseConnection();
    db.serialize(() => {
        db.run('INSERT INTO Sankasya (DiscordName, twitterId, gameName, ishost) VALUES (?, ?, ?, ?)', [DiscordName, twitterId, gameName, dbIshost],(error, results) => {
            if(error){
                console.error(error.message);
            }
            else{
                console.log('参加者テーブルにデータが登録されました');
                db.close();
                res.render('success');
            }
        });
    });
});

//check.ejsの表示
app.get('/check', (req, res) => {
    res.render('check', {errors: []});
});

//管理者画面のパスワード入力
app.post('/check',
(req, res, next) => {
    //入力チェック
    const password = req.body.password;
    const PasswordErrors = [];
    if(password === ''){
        PasswordErrors.push('パスワードが入力されていません');
    }
    if(PasswordErrors.length === 1){
        res.render('check', {errors:PasswordErrors});
    } else {
        next();
    }
},(req, res) => {
    const password = req.body.password;
    const PasswordErrors = [];
    //決めたパスワードはここ
    const pass = 'pass';
    if(password === pass){
        //パスワードが正解なら参加希望者一覧画面を表示
        const db = openDatabaseConnection();
        db.serialize(() => {
            db.all('SELECT * FROM Sankasya', (error, results) => {
                if(error){
                    console.log(error.message);
                    db.close();
                } else {
                    res.render('list', {results});
                }
                db.close();
            });
        });
    } else {
        PasswordErrors.push('パスワードが間違っています');
        res.render('check', {errors:PasswordErrors});
    }
});

//削除処理
app.get('/delete', (req, res) => {
    const db = openDatabaseConnection();
    db.run('DELETE FROM Sankasya', (error) => {
        if(error){
            console.log(error.message);
            db.close();
            return;
        } else {
            console.log('参加者テーブルの全てのデータが削除されました');
            //参加希望者一覧画面の表示
            db.all('SELECT * FROM Sankasya', (error, results) => {
                if(error){
                    console.log(error.message);
                    db.close();
                    return;
                } else {
                    res.render('list', {results});
                    db.close();    
                }
            });
        }
    });
});

//次の開催日時の保存
app.post('/next', (req, res) => {
    const month = req.body.month;
    const day = req.body.day;
    const time = req.body.time;
    const Db = openDatabaseConnection();
    Db.serialize(() => {
        Db.run('INSERT INTO Date (MONTH, DAY, TIME) VALUES (?, ?, ?)', [month, day, time],(error, results) => {
            if(error){
                console.error(error.message);
                Db.close();
            }
            else{
                console.log('開催日テーブルにデータが登録されました');
                //次の開催日時を取得してindex.ejsを表示
                Db.all('SELECT * FROM Date ORDER BY ID DESC LIMIT 1', (error, results) => {
                    if(error){
                        console.log(error.message);
                        Db.close();
                    } else {
                        Db.close();
                        res.render('index', {results});
                    }
                });
            };
        });
    });
});

app.listen(11010, () => {
    console.log('Server is running on port 11010');
});