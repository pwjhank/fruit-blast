class FruitBlast {
    constructor() {
        this.boardSize = 8;
        this.fruits = ['apple','orange','grape','strawberry','lemon','peach'];
        this.fruitEmojis = {'apple':'🍎','orange':'🍊','grape':'🍇','strawberry':'🍓','lemon':'🍋','peach':'🍑'};
        this.board = [];
        this.selected = null;
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.target = 1000;
        this.processing = false;
        this.levels = [
            {target:1000,moves:30},{target:2500,moves:28},
            {target:4000,moves:25},{target:6000,moves:25},{target:10000,moves:20}
        ];
        this.init();
    }
    
    init() {
        this.createBoard();
        this.render();
        this.updateUI();
    }
    
    createBoard() {
        this.board = [];
        for(let r=0;r<this.boardSize;r++){
            this.board[r]=[];
            for(let c=0;c<this.boardSize;c++){
                let f;
                do{f=this.fruits[Math.floor(Math.random()*this.fruits.length)];}
                while(this.wouldMatch(r,c,f));
                this.board[r][c]=f;
            }
        }
    }
    
    wouldMatch(r,c,f) {
        let h=1,v=1;
        for(let i=c-1;i>=0&&this.board[r]&&this.board[r][i]===f;i--)h++;
        for(let i=c+1;i<this.boardSize&&this.board[r]&&this.board[r][i]===f;i++)h++;
        for(let i=r-1;i>=0&&this.board[i]&&this.board[i][c]===f;i--)v++;
        for(let i=r+1;i<this.boardSize&&this.board[i]&&this.board[i][c]===f;i++)v++;
        return h>=3||v>=3;
    }
    
    render() {
        const b=document.getElementById('gameBoard');
        if(!b)return;
        b.innerHTML='';
        for(let r=0;r<this.boardSize;r++){
            for(let c=0;c<this.boardSize;c++){
                const d=document.createElement('div');
                d.className='cell';
                d.dataset.row=r;
                d.dataset.col=c;
                const fruit=this.board[r][c];
                // 尝试用图片，失败则回退到emoji
                const img=document.createElement('img');
                img.src='assets/images/'+fruit+'.png';
                img.style.width='75%';
                img.style.height='75%';
                img.style.objectFit='contain';
                img.onerror=()=>{d.textContent=this.fruitEmojis[fruit]||'❓';d.style.fontSize='clamp(20px,4vw,32px)';};
                d.appendChild(img);
                d.onclick=()=>this.click(r,c);
                b.appendChild(d);
            }
        }
        // 背景图
        b.style.backgroundImage="url('assets/images/background.png')";
        b.style.backgroundSize='cover';
        b.style.backgroundPosition='center';
    }
    
    click(r,c) {
        if(this.processing)return;
        const el=document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if(!this.selected){
            this.selected={r,c};
            el.classList.add('selected');
        }else{
            const pr=this.selected.r,pc=this.selected.c;
            const adj=(Math.abs(r-pr)===1&&c===pc)||(Math.abs(c-pc)===1&&r===pr);
            if(adj)this.swap(pr,pc,r,c);
            document.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));
            this.selected=null;
        }
    }
    
    async swap(r1,c1,r2,c2) {
        this.processing=true;
        [this.board[r1][c1],this.board[r2][c2]]=[this.board[r2][c2],this.board[r1][c1]];
        this.render();
        await this.wait(100);
        const m=this.findMatches();
        if(m.length>0){
            this.moves--;
            this.updateUI();
            await this.process(m);
            this.checkEnd();
        }else{
            await this.wait(200);
            [this.board[r1][c1],this.board[r2][c2]]=[this.board[r2][c2],this.board[r1][c1]];
            this.render();
        }
        this.processing=false;
    }
    
    findMatches() {
        const s=new Set();
        for(let r=0;r<this.boardSize;r++){
            for(let c=0;c<this.boardSize-2;c++){
                const f=this.board[r][c];
                if(f&&this.board[r][c+1]===f&&this.board[r][c+2]===f){
                    s.add(`${r},${c}`);s.add(`${r},${c+1}`);s.add(`${r},${c+2}`);
                }
            }
        }
        for(let c=0;c<this.boardSize;c++){
            for(let r=0;r<this.boardSize-2;r++){
                const f=this.board[r][c];
                if(f&&this.board[r+1][c]===f&&this.board[r+2][c]===f){
                    s.add(`${r},${c}`);s.add(`${r+1},${c}`);s.add(`${r+2},${c}`);
                }
            }
        }
        return Array.from(s).map(x=>{const[r,c]=x.split(',').map(Number);return{r,c};});
    }
    
    async process(matches) {
        let combo=0;
        while(true){
            const m=this.findMatches();
            if(m.length===0)break;
            combo++;
            this.score+=m.length*100*(combo>1?combo:1);
            if(combo>1)this.showCombo(combo);
            m.forEach(({r,c})=>{
                const el=document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if(el)el.classList.add('matched');
            });
            await this.wait(300);
            m.forEach(({r,c})=>this.board[r][c]=null);
            this.drop();
            this.fill();
            this.render();
            await this.wait(200);
        }
        this.updateUI();
    }
    
    drop() {
        for(let c=0;c<this.boardSize;c++){
            let col=[];
            for(let r=this.boardSize-1;r>=0;r--){
                if(this.board[r][c])col.push(this.board[r][c]);
            }
            while(col.length<this.boardSize)col.push(this.fruits[Math.floor(Math.random()*this.fruits.length)]);
            for(let r=0;r<this.boardSize;r++)this.board[this.boardSize-1-r][c]=col[r];
        }
    }
    
    fill() {
        for(let r=0;r<this.boardSize;r++){
            for(let c=0;c<this.boardSize;c++){
                if(!this.board[r][c])this.board[r][c]=this.fruits[Math.floor(Math.random()*this.fruits.length)];
            }
        }
    }
    
    showCombo(n) {
        const d=document.getElementById('comboDisplay');
        if(!d)return;
        d.textContent=`COMBO x${n}!`;
        d.classList.add('show');
        setTimeout(()=>d.classList.remove('show'),1000);
    }
    
    updateUI() {
        const s=document.getElementById('score');
        const m=document.getElementById('moves');
        const t=document.getElementById('target');
        const l=document.getElementById('level');
        const p=document.getElementById('progressFill');
        if(s)s.textContent=this.score;
        if(m)m.textContent=this.moves;
        if(t)t.textContent=this.target;
        if(l)l.textContent=this.level;
        if(p)p.style.width=Math.min(100,(this.score/this.target)*100)+'%';
    }
    
    checkEnd() {
        if(this.score>=this.target){
            const stars=this.score>=this.target*2?3:this.score>=this.target*1.5?2:1;
            this.showModal('🎉 关卡完成！',`得分: ${this.score}`,stars,true);
        }else if(this.moves<=0){
            this.showModal('😢 游戏结束',`得分: ${this.score} / 目标: ${this.target}`,0,false);
        }
    }
    
    showModal(title,msg,stars,win) {
        const mt=document.getElementById('modalTitle');
        const mm=document.getElementById('modalMessage');
        const ms=document.getElementById('stars');
        const nb=document.getElementById('nextBtn');
        const gm=document.getElementById('gameModal');
        if(mt)mt.textContent=title;
        if(mm)mm.textContent=msg;
        if(ms)ms.textContent='⭐'.repeat(stars);
        if(nb)nb.style.display=win&&this.level<this.levels.length?'inline-block':'none';
        if(gm)gm.classList.add('show');
    }
    
    restart() {
        this.score=0;
        this.moves=this.levels[this.level-1].moves;
        this.target=this.levels[this.level-1].target;
        document.getElementById('gameModal').classList.remove('show');
        this.init();
    }
    
    nextLevel() {
        if(this.level<this.levels.length){
            this.level++;
            this.restart();
        }
    }
    
    togglePause() {
        this.processing=!this.processing;
    }
    
    wait(ms){return new Promise(r=>setTimeout(r,ms));}
}

const game=new FruitBlast();
