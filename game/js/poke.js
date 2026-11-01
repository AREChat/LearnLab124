// =============================================================================
// DOM要素の取得
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});

// =============================================================================
// ゲーム全体の管理クラス
// =============================================================================
class Game {
    constructor() {
        // ゲームデータ
        this.POKEMON_MASTER_MIKATA = {};
        this.POKEMON_MASTER_TEKI = {};
        this.MOVES_MASTER = {};
        this.ITEMS_MASTER = {};
        this.TRAINER_MASTER = {};
        this.HOW_TO_PLAY_DATA = {};
        this.TYPE_CHART = {};

        // ゲーム状態
        this.playerPokemon = null;
        this.opponentPokemon = null;
        this.playerName = '';
        this.playerAvatarName = '';
        this.opponentName = '';
        this.inventory = {};
        this.money = 1000;
        this.currentDexType = 'pokemon';

        // UI要素
        this.dom = {
            screens: document.querySelectorAll('.screen'),
            backToTitleButton: document.getElementById('back-to-title-button'),
        };
    }

    // =============================================================================
    // 初期化処理
    // =============================================================================
    async init() {
        await this.loadGameData();
        this.setupEventListeners();
        this.setView('title-screen');
    }

    async loadGameData() {
        try {
            const [pokedex, play, types] = await Promise.all([
                fetch('data/pokedex.json').then(res => res.json()),
                fetch('data/play.json').then(res => res.json()),
                fetch('data/type.json').then(res => res.json()),
            ]);

            this.POKEMON_MASTER_MIKATA = pokedex.pokemon.mikata;
            this.POKEMON_MASTER_TEKI = pokedex.pokemon.teki;
            this.ITEMS_MASTER = pokedex.items;
            this.MOVES_MASTER = Object.fromEntries(
                Object.entries(pokedex.moves).map(([key, value]) => [key, new Move(value.name, value.power, value.move_type, value.description)])
            );
            this.HOW_TO_PLAY_DATA = play;
            this.TYPE_CHART = types;
            
            this.TRAINER_MASTER = {
                "サトシ": { "img": "assets/Satoshi.png" }, "ヒカリ": { "img": "assets/Hikari.png" },
                "タケシ": { "img": "assets/Takeshi.png" }, "リコ": { "img": "assets/Riko.png" },
                "セレナ": { "img": "assets/Serena.png" }, "サンゴ": { "img": "assets/Sango.png" }
            };

        } catch (error) {
            console.error("ゲームデータの読み込みに失敗しました:", error);
            document.body.innerHTML = `<div class="error-text">エラー: ゲームデータの読み込みに失敗しました。ファイルを確認してください。</div>`;
        }
    }

    // =============================================================================
    // イベントリスナー設定
    // =============================================================================
    setupEventListeners() {
        document.querySelector('#title-screen .title-menu').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const action = e.target.dataset.action;
            switch (action) {
                case 'new-game': this.showSelectionScreen(); break;
                case 'load-game': this.showSlotSelectionScreen(false); break;
                case 'how-to-play': this.showInfoScreen('how-to-play'); break;
                case 'pokedex': this.showDexScreen(this.currentDexType); break;
                case 'quit': window.location.href = 'index1.html'; break;
            }
        });

        this.dom.backToTitleButton.addEventListener('click', () => this.setView('title-screen'));
        
        document.getElementById('start-game-button').addEventListener('click', () => this.startGameFromSelection());

        document.getElementById('main-commands').addEventListener('click', (e) => {
            if(e.target.tagName !== 'BUTTON') return;
            const command = e.target.dataset.command;
            this.handleMainCommand(command);
        });

        document.querySelector('.dex-nav').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const dexType = e.target.dataset.dexType;
            if (dexType) {
                this.currentDexType = dexType;
                document.querySelectorAll('.dex-nav button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.showDexScreen(dexType, false);
            }
        });
    }

    // =============================================================================
    // 画面遷移
    // =============================================================================
    setView(viewId) {
        this.dom.screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');

        const isTitle = viewId === 'title-screen';
        this.dom.backToTitleButton.style.display = isTitle ? 'none' : 'block';
    }
    
    // =============================================================================
    // キャラクター選択画面 (★最初のパートナーを変更★)
    // =============================================================================
    showSelectionScreen() {
        const trainerAvatarSelect = document.getElementById('trainer-avatar-select');
        trainerAvatarSelect.innerHTML = Object.keys(this.TRAINER_MASTER)
            .map(name => `<option value="${name}">${name}</option>`).join('');

        const pokemonSelect = document.getElementById('pokemon-select');
        // 新しいポケモンを追加
        const initialPartners = ["ピカチュウ", "ヒトカゲ", "ゼニガメ", "フシギダネ", "イーブイ"];
        pokemonSelect.innerHTML = initialPartners
            .map(name => `<option value="${name}">${name}</option>`).join('');
            
        document.getElementById('pokemon-nickname-input').placeholder = pokemonSelect.value;
        pokemonSelect.onchange = () => {
            document.getElementById('pokemon-nickname-input').placeholder = pokemonSelect.value;
        };

        this.setView('selection-screen');
    }

    // =============================================================================
    // セーブ/ロード画面表示
    // =============================================================================
    showSlotSelectionScreen(isSaving) {
        const title = document.getElementById('slot-title');
        const slotContainer = document.getElementById('slot-container');
        
        title.textContent = isSaving ? 'どこに きろくしますか？' : 'どのデータからはじめますか？';

        slotContainer.innerHTML = `
            <div class="slot-row"><button>データ１ (まだ つくられていない)</button><button class="delete-button">×</button></div>
            <div class="slot-row"><button>データ２ (まだ つくられていない)</button><button class="delete-button">×</button></div>
            <div class="slot-row"><button>データ３ (まだ つくられていない)</button><button class="delete-button">×</button></div>
        `;
        
        this.setView('slot-selection-screen');
    }

    // =============================================================================
    // あそびかた画面表示
    // =============================================================================
    showInfoScreen(type) {
        const titleEl = document.getElementById('info-title');
        const contentEl = document.getElementById('info-content');
        let contentHTML = '';

        if (type === 'how-to-play') {
            titleEl.textContent = 'あそびかた';
            if (this.HOW_TO_PLAY_DATA && this.HOW_TO_PLAY_DATA.sections) {
                for (const section of this.HOW_TO_PLAY_DATA.sections) {
                    const heading = section.heading || '無題';
                    const body = (section.body || '').replace(/\n/g, '<br>');
                    contentHTML += `<h2>${heading}</h2><p>${body}</p>`;
                }
            } else {
                 contentHTML = '<p>あそびかたデータの読み込みに失敗しました。</p>';
            }
        }
        
        contentEl.innerHTML = contentHTML;
        this.setView('info-screen');
    }
    
    // =============================================================================
    // ずかん画面表示
    // =============================================================================
    showDexScreen(type, shouldSetView = true) {
        const listEl = document.getElementById('dex-list');
        const detailsEl = document.getElementById('dex-details');
        
        listEl.innerHTML = '';
        detailsEl.innerHTML = '<h2>リストから えらんでください</h2>';

        let masterData, detailRenderer;

        switch (type) {
            case 'pokemon':
                masterData = this.POKEMON_MASTER_MIKATA;
                detailRenderer = this.showPokemonDetails.bind(this);
                break;
            case 'move':
                masterData = this.MOVES_MASTER;
                detailRenderer = this.showMoveDetails.bind(this);
                break;
            case 'item':
                masterData = this.ITEMS_MASTER;
                detailRenderer = this.showItemDetails.bind(this);
                break;
            default:
                return;
        }

        for (const name of Object.keys(masterData).sort()) {
            const button = document.createElement('button');
            button.textContent = name;
            button.onclick = () => detailRenderer(name);
            listEl.appendChild(button);
        }
        
        if (shouldSetView) {
            this.setView('dex-screen');
        }
    }

    showPokemonDetails(name) {
        const detailsEl = document.getElementById('dex-details');
        const data = this.POKEMON_MASTER_MIKATA[name];
        if (!data) return;

        detailsEl.innerHTML = `
            <img src="assets/${data.img}" alt="${name}" style="width:150px; height:150px;">
            <h2>${name}</h2>
            <p><strong>タイプ:</strong> ${data.types.join(' / ')}</p>
            <p>${data.description || ''}</p>
            <h3>おぼえるわざ:</h3>
            <p>${(data.learnable_moves || []).join(', ')}</p>
        `;
    }

    showMoveDetails(name) {
        const detailsEl = document.getElementById('dex-details');
        const data = this.MOVES_MASTER[name];
        if (!data) return;

        detailsEl.innerHTML = `
            <h2>${name}</h2>
            <p><strong>タイプ:</strong> ${data.type}</p>
            <p><strong>いりょく:</strong> ${data.power}</p>
            <p>${data.description || ''}</p>
        `;
    }

    showItemDetails(name) {
        const detailsEl = document.getElementById('dex-details');
        const data = this.ITEMS_MASTER[name];
        if (!data) return;

        detailsEl.innerHTML = `
            <h2>${name}</h2>
            <p>${data.description || ''}</p>
        `;
    }

    startGameFromSelection() {
        const trainerName = document.getElementById('trainer-name-input').value;
        const avatarName = document.getElementById('trainer-avatar-select').value;
        const pokemonSpecies = document.getElementById('pokemon-select').value;
        const nickname = document.getElementById('pokemon-nickname-input').value || pokemonSpecies;

        const errorEl = document.getElementById('selection-error');
        if (!/^[ぁ-んァ-ヶa-zA-Z0-9]+$/.test(trainerName)) {
            errorEl.textContent = "トレーナー名には ひらがな、カタカナ、英数字のみ使えます。";
            return;
        }
        if (nickname && !/^[ぁ-んァ-ヶa-zA-Z0-9]+$/.test(nickname)) {
            errorEl.textContent = "ニックネームには ひらがな、カタカナ、英数字のみ使えます。";
            return;
        }
        errorEl.textContent = "";

        this.playerName = trainerName;
        this.playerAvatarName = avatarName;
        this.money = 1000;
        this.inventory = {"すごいキズぐすり": 3, "プラスパワー": 10, "ディフェンダー": 10, "いのちのおまもり": 5, "モンスターボール": 5};

        const pData = this.POKEMON_MASTER_MIKATA[pokemonSpecies];
        const playerHp = pData.hp * 10;
        this.playerPokemon = new Pokemon(pokemonSpecies, 1, pData.types, playerHp, pData.atk, pData.dfs, `assets/${pData.img}`, this);
        this.playerPokemon.name = nickname;
        this.playerPokemon.moves = this.getRandomMoves(pData.learnable_moves, 2);

        this.startNewBattle();
    }

    // =============================================================================
    // 戦闘ロジック
    // =============================================================================
    startNewBattle() {
        const opponentTrainers = Object.keys(this.TRAINER_MASTER).filter(name => name !== this.playerAvatarName);
        this.opponentName = this.getRandomElement(opponentTrainers);
        
        const opponentPokemonName = this.getRandomElement(Object.keys(this.POKEMON_MASTER_TEKI));
        const oData = this.POKEMON_MASTER_TEKI[opponentPokemonName];
        const opponentLevel = Math.max(1, this.playerPokemon.level + this.getRandomInt(-1, 2));
        const opponentHp = oData.hp + opponentLevel * 5;

        this.opponentPokemon = new Pokemon(opponentPokemonName, opponentLevel, oData.types, opponentHp, oData.atk, oData.dfs, `assets/${oData.img}`, this);
        this.opponentPokemon.moves = this.getRandomMoves(oData.learnable_moves, 4);

        this.setView('battle-screen');
        this.updateUI();
        this.showMessage(`${this.opponentName}が しょうぶを しかけてきた！`, 1500)
            .then(() => this.showMessage(`ゆけっ！ ${this.playerPokemon.name}！`, 1500))
            .then(() => this.showMessage("どうする？", 0));
    }
    
    handleMainCommand(command) {
        switch(command) {
            case 'fight': this.showMoveCommands(); break;
            case 'items': this.showItemCommands(); break;
            case 'shop': this.showShop(); break;
        }
    }

    showMoveCommands() {
        const movesContainer = document.getElementById('moves-commands');
        movesContainer.innerHTML = '';
        this.playerPokemon.moves.forEach(move => {
            const button = document.createElement('button');
            button.textContent = move.name;
            button.onclick = () => this.playerAttack(move);
            movesContainer.appendChild(button);
        });
        const backButton = document.createElement('button');
        backButton.textContent = 'もどる';
        backButton.onclick = () => this.showMainCommands();
        movesContainer.appendChild(backButton);

        document.getElementById('main-commands').style.display = 'none';
        movesContainer.style.display = 'grid';
    }

    showItemCommands() {
        console.log("showItemCommands is not implemented yet.");
        this.showMessage("どうぐ をつかう きのうは まだ じっそうされていません", 1500);
    }

    showMainCommands() {
        document.getElementById('moves-commands').style.display = 'none';
        document.getElementById('items-commands').style.display = 'none';
        document.getElementById('main-commands').style.display = 'grid';
    }

    async playerAttack(move) {
        this.showMainCommands();
        this.setCommandsEnabled(false);

        await this.processAttack(this.playerPokemon, this.opponentPokemon, move, 'player');

        if (!this.opponentPokemon.isFainted()) {
            await this.sleep(1000);
            await this.opponentTurn();
        }
        
        if (!this.playerPokemon.isFainted() && !this.opponentPokemon.isFainted()) {
            this.setCommandsEnabled(true);
        }
    }
    
    async opponentTurn() {
        await this.showMessage(`あいての ${this.opponentPokemon.name} のこうげき！`, 1200);
        const move = this.getRandomElement(this.opponentPokemon.moves);
        await this.processAttack(this.opponentPokemon, this.playerPokemon, move, 'opponent');
    }

    async processAttack(attacker, defender, move, side) {
        const attackerImage = document.getElementById(side === 'player' ? 'player-pokemon-image' : 'opponent-pokemon-image');
        const defenderImage = document.getElementById(side === 'player' ? 'opponent-pokemon-image' : 'player-pokemon-image');

        attackerImage.classList.add(side === 'player' ? 'is-attacking-player' : 'is-attacking-opponent');
        await this.showMessage(`${attacker.name} の ${move.name}！`, 1200);
        attackerImage.classList.remove(side === 'player' ? 'is-attacking-player' : 'is-attacking-opponent');
        
        if (move.power === 0) {
            await this.showMessage("しかし うまくきまらなかった！", 1500);
            return;
        }

        let multiplier = 1.0;
        defender.types.forEach(defType => {
            multiplier *= this.TYPE_CHART[move.type]?.[defType] ?? 1;
        });

        if (multiplier > 1) await this.showMessage("こうかは ばつぐんだ！", 800);
        else if (multiplier > 0 && multiplier < 1) await this.showMessage("こうかは いまひとつのようだ…", 800);
        else if (multiplier === 0) await this.showMessage("こうかが ないようだ…", 800);
        
        let damage = Math.ceil(((attacker.level * 0.4 + 2) * move.power * attacker.attack_stat / defender.defense_stat / 50 + 2) * multiplier);
        if (Math.random() < 0.1) {
            await this.showMessage("きゅうしょに あたった！", 800);
            damage = Math.ceil(damage * 1.5);
        }
        if (defender.isDefending) damage = Math.floor(damage / 2);
        damage = Math.max(1, damage);

        defenderImage.classList.add('is-taking-damage');
        defender.current_hp = Math.max(0, defender.current_hp - damage);
        this.updateUI();
        await this.sleep(500);
        defenderImage.classList.remove('is-taking-damage');
        await this.showMessage(`${defender.name} は ${damage} のダメージをうけた！`, 1200);

        if (defender.isFainted()) {
            defenderImage.classList.add('is-fainted');
            await this.showMessage(`${defender.name}は たおれた！`, 1500);
            await this.endBattle(side === 'player'); // awaitを追加して仲間イベントを待つ
        }
    }

    // =============================================================================
    // 戦闘終了処理 (★仲間になる機能を追加★)
    // =============================================================================
    async endBattle(playerWon) {
        if (playerWon) {
            const prizeMoney = this.getRandomInt(100, 500);
            this.money += prizeMoney;
            await this.showMessage(`しょうぶに かった！`, 1500);
            await this.showMessage(`${this.opponentName}から ${prizeMoney}円を てにいれた！`, 1800);
            
            const expGained = 50 * this.opponentPokemon.level;
            await this.playerPokemon.addExp(expGained);
            
            // ★ここから仲間になるイベント★
            // 20% (5回に1回) の確率で発生
            if (Math.random() < 0.2) {
                const capturedPokemonName = this.opponentPokemon.base_name;

                // 倒したポケモンが味方データに存在するか確認
                if (this.POKEMON_MASTER_MIKATA[capturedPokemonName]) {
                    await this.showMessage(`${capturedPokemonName}が なかまに なりたそうに こちらをみている！`, 2000);
                    
                    // 現在のポケモンと入れ替える処理
                    const oldPokemonName = this.playerPokemon.name;
                    const oldPokemonLevel = this.playerPokemon.level; // レベルを引き継ぐ

                    const pData = this.POKEMON_MASTER_MIKATA[capturedPokemonName];
                    const newHp = pData.hp * 10;
                    
                    // 新しいポケモンを生成
                    this.playerPokemon = new Pokemon(capturedPokemonName, oldPokemonLevel, pData.types, newHp, pData.atk, pData.dfs, `assets/${pData.img}`, this);
                    this.playerPokemon.moves = this.getRandomMoves(pData.learnable_moves, 2);

                    await this.showMessage(`${oldPokemonName}と いれかえて、${capturedPokemonName}を なかまに くわえた！`, 2500);
                    this.updateUI(); // UIを更新して新しいポケモンを表示
                }
            }
            
            await this.sleep(1500);
            this.showEndGameCommands();

        } else {
            await this.showMessage(`${this.playerPokemon.name}は たおれた...`, 1500);
            await this.showMessage(`目の前が まっ暗に なった！`, 2000);
            this.showEndGameCommands();
        }
    }
    
    showEndGameCommands() {
        document.getElementById('main-commands').style.display = 'none';
        document.getElementById('end-game-commands').style.display = 'grid';
    }

    // =============================================================================
    // UI更新
    // =============================================================================
    updateUI() {
        if (!this.playerPokemon || !this.opponentPokemon) return;

        document.getElementById('opponent-name-text').textContent = this.opponentPokemon.name;
        document.getElementById('opponent-level-text').textContent = this.opponentPokemon.level;
        const opponentHpPercent = (this.opponentPokemon.current_hp / this.opponentPokemon.max_hp) * 100;
        document.getElementById('opponent-hp-bar').style.width = `${opponentHpPercent}%`;
        this.updateBarColor(document.getElementById('opponent-hp-bar'), opponentHpPercent);
        document.getElementById('opponent-pokemon-image').src = this.opponentPokemon.image_path;
        document.getElementById('opponent-trainer-image').src = this.TRAINER_MASTER[this.opponentName]?.img || '';

        document.getElementById('player-name-text').textContent = this.playerPokemon.name;
        document.getElementById('player-level-text').textContent = this.playerPokemon.level;
        const playerHpPercent = (this.playerPokemon.current_hp / this.playerPokemon.max_hp) * 100;
        document.getElementById('player-hp-bar').style.width = `${playerHpPercent}%`;
        this.updateBarColor(document.getElementById('player-hp-bar'), playerHpPercent);
        document.getElementById('player-hp-text').textContent = `${Math.ceil(this.playerPokemon.current_hp)} / ${this.playerPokemon.max_hp}`;
        
        const expPercent = this.playerPokemon.exp_to_next_level > 0 ? (this.playerPokemon.exp / this.playerPokemon.exp_to_next_level) * 100 : 100;
        document.getElementById('player-exp-bar').style.width = `${expPercent}%`;
        document.getElementById('player-exp-text').textContent = `次のレベルまで: ${Math.max(0, this.playerPokemon.exp_to_next_level - this.playerPokemon.exp)}`;
        
        document.getElementById('player-pokemon-image').src = this.playerPokemon.image_path;
        document.getElementById('player-trainer-image').src = this.TRAINER_MASTER[this.playerAvatarName]?.img || '';
    }

    updateBarColor(barElement, percentage) {
        if (percentage < 20) barElement.style.backgroundColor = 'var(--hp-low)';
        else if (percentage < 50) barElement.style.backgroundColor = 'var(--hp-mid)';
        else barElement.style.backgroundColor = 'var(--hp-high)';
    }

    setCommandsEnabled(isEnabled) {
        document.querySelectorAll('#command-area button').forEach(btn => btn.disabled = !isEnabled);
    }

    // =============================================================================
    // メッセージ表示
    // =============================================================================
    showMessage(text, duration) {
        return new Promise(resolve => {
            const messageText = document.getElementById('message-text');
            messageText.textContent = '';
            let i = 0;
            const typing = setInterval(() => {
                if (i < text.length) {
                    messageText.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(typing);
                    if (duration > 0) {
                        setTimeout(resolve, duration);
                    } else {
                        resolve();
                    }
                }
            }, 50);
        });
    }

    // =============================================================================
    // ヘルパー関数
    // =============================================================================
    getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    getRandomMoves(moveList, count) {
        const shuffled = [...moveList].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length)).map(moveName => this.MOVES_MASTER[moveName]);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // =============================================================================
    // 買い物
    // =============================================================================
    showShop() {
        const shopModal = document.getElementById('shop-modal');
        const shopMoney = document.getElementById('shop-money');
        const shopItemList = document.getElementById('shop-item-list');
        const overlay = document.getElementById('modal-overlay');

        shopMoney.textContent = this.money;
        shopItemList.innerHTML = '';

        for (const itemName in this.ITEMS_MASTER) {
            if (!this.ITEMS_MASTER[itemName].effect) continue;

            const item = this.ITEMS_MASTER[itemName];
            const price = this.getRandomInt(150, 450);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
            const itemInfo = document.createElement('span');
            itemInfo.textContent = `${itemName} (${price}円)`;
            
            const buyButton = document.createElement('button');
            buyButton.textContent = 'かう';
            buyButton.onclick = () => this.buyItem(itemName, price);

            itemDiv.appendChild(itemInfo);
            itemDiv.appendChild(buyButton);
            shopItemList.appendChild(itemDiv);
        }

        document.getElementById('shop-close-button').onclick = () => {
            shopModal.style.display = 'none';
            overlay.style.display = 'none';
        };

        overlay.style.display = 'flex';
        shopModal.style.display = 'block';
    }

    buyItem(itemName, price) {
        if (this.money < price) {
            this.showMessage("おこづかいが たりない！", 1200);
            return;
        }

        const currentCount = this.inventory[itemName] || 0;
        if (currentCount >= 999) {
            this.showMessage("もう これいじょう もてない！", 1200);
            return;
        }

        this.money -= price;
        this.inventory[itemName] = currentCount + 1;
        
        document.getElementById('shop-money').textContent = this.money;
        this.showMessage(`${itemName}を てにいれた！`, 1200);
    }
}

// =============================================================================
// ポケモンと技のクラス定義
// =============================================================================
class Pokemon {
    constructor(name, level, types, max_hp, attack_stat, defense_stat, image_path, gameInstance) {
        this.base_name = name;
        this.name = name;
        this.level = level;
        this.types = types;
        this.max_hp = max_hp;
        this.current_hp = max_hp;
        this.attack_stat = attack_stat;
        this.defense_stat = defense_stat;
        this.image_path = image_path;
        this.moves = [];
        this.exp = 0;
        this.exp_to_next_level = 10 * (this.level ** 2);
        this.is_defending = false;
        this.game = gameInstance;
    }

    isFainted() {
        return this.current_hp <= 0;
    }
    
    async addExp(amount) {
        if (this.isFainted() || this.level >= 100) return;
    
        await this.game.showMessage(`${this.name}は ${amount}ポイントの けいけんちを かくとく！`, 1500);
    
        this.exp += amount;
        let leveledUp = false;
        while (this.exp >= this.exp_to_next_level && this.level < 100) {
            await this.levelUp();
            leveledUp = true;
        }
        
        if (!leveledUp) {
            this.game.updateUI();
        }
    }

    async levelUp() {
        this.exp -= this.exp_to_next_level;
        this.level++;
        
        const hp_gain = this.game.getRandomInt(20, 50);
        const atk_gain = this.game.getRandomInt(2, 4);
        const dfs_gain = this.game.getRandomInt(2, 4);
        
        this.max_hp += hp_gain;
        this.attack_stat += atk_gain;
        this.defense_stat += dfs_gain;
        this.current_hp = this.max_hp;
        this.exp_to_next_level = 10 * (this.level ** 2);
        
        const playerImage = document.getElementById('player-pokemon-image');
        playerImage.classList.add('is-leveling-up');
        
        await this.game.showMessage(`おや・・・？ ${this.name}の ようすが・・・！`, 1500);
        await this.game.showMessage(`${this.name}は レベル ${this.level}に あがった！`, 2000);
        
        playerImage.classList.remove('is-leveling-up');
        this.game.updateUI();
    }
}

class Move {
    constructor(name, power, move_type, description) {
        this.name = name;
        this.power = power;
        this.type = move_type;
        this.description = description;
    }
}
    
