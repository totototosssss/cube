document.addEventListener('DOMContentLoaded', () => {
    const facesElements = {
        U: document.getElementById('up-face'), L: document.getElementById('left-face'),
        F: document.getElementById('front-face'), R: document.getElementById('right-face'),
        B: document.getElementById('back-face'), D: document.getElementById('down-face'),
    };
    const turnsCountElement = document.getElementById('turns-count');
    const seedInputElement = document.getElementById('seed-input');
    const generateCubeButton = document.getElementById('generate-cube-button');
    const controlsGrid = document.querySelector('.controls-grid');
    const gameModeSelect = document.getElementById('game-mode-select');
    const currentModeDisplay = document.getElementById('current-mode-display');

    const clearModal = document.getElementById('clear-modal');
    const modalTitleElement = document.getElementById('modal-title');
    const clearMessageElement = document.getElementById('clear-message');
    const newGameFromModalButton = document.getElementById('new-game-from-modal-button');
    const closeModalButton = document.getElementById('close-modal-button');

    let cubeState;
    let turns = 0;
    let currentSeed = '';
    let prng_seed;
    let currentGameMode = '6_face';

    const faceKeys = ['U', 'L', 'F', 'R', 'B', 'D'];
    const initialFaceColors = { U: 'W', L: 'O', F: 'B', R: 'R', B: 'G', D: 'Y' };
    const colorNames = { W: '白', Y: '黄', B: '青', G: '緑', R: '赤', O: '橙' };

    function prng_sRandom(seed) {
        prng_seed = Math.abs(Math.floor(seed)) % 2147483647;
        if (prng_seed === 0) prng_seed = 1;
    }
    function prng_random() {
        if (prng_seed === undefined) prng_sRandom(Math.floor(Date.now() * Math.random()) + 1);
        prng_seed = (prng_seed * 16807) % 2147483647;
        return (prng_seed -1) / 2147483646;
    }

    function getInitialCubeState() {
        const state = {};
        faceKeys.forEach(key => {
            state[key] = Array(3).fill(null).map(() => Array(3).fill(initialFaceColors[key]));
        });
        return state;
    }

    function renderCube() {
        for (const faceKey of faceKeys) {
            const faceElement = facesElements[faceKey];
            if (!faceElement) continue;
            faceElement.innerHTML = '';
            cubeState[faceKey].forEach((row, rIdx) => {
                row.forEach((color, cIdx) => {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    if (color === 'W') {
                        cell.classList.add('cell-image-W');
                    } else {
                        cell.classList.add(`color-${color}`);
                    }
                    if (rIdx === 1 && cIdx === 1) {
                        cell.classList.add('center-cell');
                        const cellFaceIdSpan = document.createElement('span');
                        cellFaceIdSpan.className = 'cell-face-id';
                        cellFaceIdSpan.textContent = faceKey;
                        cell.appendChild(cellFaceIdSpan);
                    }
                    faceElement.appendChild(cell);
                });
            });
        }
        turnsCountElement.textContent = turns;
        updateModeDisplay();
    }
    
    function updateModeDisplay() {
        const selectedOption = gameModeSelect.options[gameModeSelect.selectedIndex];
        currentModeDisplay.textContent = selectedOption.text;
    }

    function rotateMatrix(matrix, clockwise = true) {
        const newMatrix = JSON.parse(JSON.stringify(matrix));
        const n = newMatrix.length;
        for (let i = 0; i < n / 2; i++) {
            for (let j = i; j < n - i - 1; j++) {
                if (clockwise) {
                    const temp = newMatrix[i][j];
                    newMatrix[i][j] = newMatrix[n - 1 - j][i];
                    newMatrix[n - 1 - j][i] = newMatrix[n - 1 - i][n - 1 - j];
                    newMatrix[n - 1 - i][n - 1 - j] = newMatrix[j][n - 1 - i];
                    newMatrix[j][n - 1 - i] = temp;
                } else {
                    const temp = newMatrix[i][j];
                    newMatrix[i][j] = newMatrix[j][n - 1 - i];
                    newMatrix[j][n - 1 - i] = newMatrix[n - 1 - i][n - 1 - j];
                    newMatrix[n - 1 - i][n - 1 - j] = newMatrix[n - 1 - j][i];
                    newMatrix[n - 1 - j][i] = temp;
                }
            }
        }
        return newMatrix;
    }
    
    const operations = {
        F: (cw) => { cubeState.F = rotateMatrix(cubeState.F, cw); let temp = cw ? [...cubeState.U[2]] : [...cubeState.U[2]].reverse(); if(cw){ for(let i=0;i<3;i++) cubeState.U[2][i]=cubeState.L[2-i][2]; for(let i=0;i<3;i++) cubeState.L[i][2]=cubeState.D[0][i]; for(let i=0;i<3;i++) cubeState.D[0][i]=cubeState.R[2-i][0]; for(let i=0;i<3;i++) cubeState.R[i][0]=temp[i]; } else { for(let i=0;i<3;i++) cubeState.U[2][i]=cubeState.R[i][0]; for(let i=0;i<3;i++) cubeState.R[i][0]=cubeState.D[0][2-i]; for(let i=0;i<3;i++) cubeState.D[0][i]=cubeState.L[i][2]; for(let i=0;i<3;i++) cubeState.L[i][2]=temp[i]; }},
        U: (cw) => { cubeState.U = rotateMatrix(cubeState.U, cw); let temp = [...cubeState.F[0]]; if(cw){ cubeState.F[0]=[...cubeState.R[0]]; cubeState.R[0]=[...cubeState.B[0]]; cubeState.B[0]=[...cubeState.L[0]]; cubeState.L[0]=temp; } else { cubeState.F[0]=[...cubeState.L[0]]; cubeState.L[0]=[...cubeState.B[0]]; cubeState.B[0]=[...cubeState.R[0]]; cubeState.R[0]=temp; }},
        R: (cw) => { cubeState.R = rotateMatrix(cubeState.R, cw); let temp = [cubeState.U[0][2],cubeState.U[1][2],cubeState.U[2][2]]; if(cw){ for(let i=0;i<3;i++) cubeState.U[i][2]=cubeState.F[i][2]; for(let i=0;i<3;i++) cubeState.F[i][2]=cubeState.D[i][2]; for(let i=0;i<3;i++) cubeState.D[i][2]=cubeState.B[2-i][0]; for(let i=0;i<3;i++) cubeState.B[2-i][0]=temp[i]; } else { for(let i=0;i<3;i++) cubeState.U[i][2]=cubeState.B[2-i][0]; for(let i=0;i<3;i++) cubeState.B[2-i][0]=cubeState.D[i][2]; for(let i=0;i<3;i++) cubeState.D[i][2]=cubeState.F[i][2]; for(let i=0;i<3;i++) cubeState.F[i][2]=temp[i]; }},
        L: (cw) => { cubeState.L = rotateMatrix(cubeState.L, cw); let temp = [cubeState.U[0][0],cubeState.U[1][0],cubeState.U[2][0]]; if(cw){ for(let i=0;i<3;i++) cubeState.U[i][0]=cubeState.B[2-i][2]; for(let i=0;i<3;i++) cubeState.B[2-i][2]=cubeState.D[i][0]; for(let i=0;i<3;i++) cubeState.D[i][0]=cubeState.F[i][0]; for(let i=0;i<3;i++) cubeState.F[i][0]=temp[i]; } else { for(let i=0;i<3;i++) cubeState.U[i][0]=cubeState.F[i][0]; for(let i=0;i<3;i++) cubeState.F[i][0]=cubeState.D[i][0]; for(let i=0;i<3;i++) cubeState.D[i][0]=cubeState.B[2-i][2]; for(let i=0;i<3;i++) cubeState.B[2-i][2]=temp[i]; }},
        B: (cw) => { cubeState.B = rotateMatrix(cubeState.B, cw); let temp = cw ? [...cubeState.U[0]] : [...cubeState.U[0]].reverse(); if(cw){ for(let i=0;i<3;i++) cubeState.U[0][i]=cubeState.R[i][2]; for(let i=0;i<3;i++) cubeState.R[i][2]=cubeState.D[2][2-i]; for(let i=0;i<3;i++) cubeState.D[2][i]=cubeState.L[2-i][0]; for(let i=0;i<3;i++) cubeState.L[i][0]=temp[i]; } else { for(let i=0;i<3;i++) cubeState.U[0][i]=cubeState.L[i][0]; for(let i=0;i<3;i++) cubeState.L[i][0]=cubeState.D[2][2-i]; for(let i=0;i<3;i++) cubeState.D[2][i]=cubeState.R[2-i][2]; for(let i=0;i<3;i++) cubeState.R[i][2]=temp[i]; }},
        D: (cw) => { cubeState.D = rotateMatrix(cubeState.D, cw); let temp = [...cubeState.F[2]]; if(cw){ cubeState.F[2]=[...cubeState.L[2]]; cubeState.L[2]=[...cubeState.B[2]]; cubeState.B[2]=[...cubeState.R[2]]; cubeState.R[2]=temp; } else { cubeState.F[2]=[...cubeState.R[2]]; cubeState.R[2]=[...cubeState.B[2]]; cubeState.B[2]=[...cubeState.L[2]]; cubeState.L[2]=temp; }}
    };

    function applyRotationAndUpdate(move) {
        const [face, type] = move.split('_');
        const clockwise = (type !== 'CCW');
        if (operations[face]) {
             if (type === '2') { operations[face](true); operations[face](true); } 
             else { operations[face](clockwise); }
        }
    }

    function brieflyHighlightFace(faceKey) {
        const faceElement = facesElements[faceKey];
        if (faceElement) {
            faceElement.classList.add('active-rotate');
            setTimeout(() => faceElement.classList.remove('active-rotate'), 180);
        }
    }

    function handleRotation(moveKey) {
        if (clearModal.classList.contains('visible')) return;
        const baseFace = moveKey.split('_')[0];
        applyRotationAndUpdate(moveKey);
        brieflyHighlightFace(baseFace);
        turns++;
        renderCube();
        checkIfSolved();
    }
    
    function isSingleFaceUniform(faceMatrix) {
        if (!faceMatrix || !faceMatrix[0] || !faceMatrix[0][0]) return false;
        const firstColor = faceMatrix[0][0];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (faceMatrix[r][c] !== firstColor) return false;
            }
        }
        return firstColor; 
    }

    function checkIfSolved() {
        let solved = false;
        let message = "";
        const seedDisplay = currentSeed && currentSeed.trim() !== '' ? `シード値「${currentSeed}」` : "ランダム盤面";

        if (currentGameMode === '6_face') {
            let allFacesCorrect = true;
            for (const faceKey of faceKeys) {
                const uniformColor = isSingleFaceUniform(cubeState[faceKey]);
                if (!uniformColor || uniformColor !== initialFaceColors[faceKey]) {
                    allFacesCorrect = false; break;
                }
            }
            if (allFacesCorrect) {
                solved = true; modalTitleElement.textContent = "全面クリア！";
                message = `おめでとうございます！${seedDisplay} を ${turns} ターンで完成！`;
            }
        } else if (currentGameMode === '1_face') {
            for (const faceKey of faceKeys) {
                const uniformColor = isSingleFaceUniform(cubeState[faceKey]);
                if (uniformColor) {
                    if (Object.values(initialFaceColors).includes(uniformColor)) {
                        solved = true; modalTitleElement.textContent = "1面クリア！";
                        message = `お見事！${seedDisplay} の ${colorNames[uniformColor]}面を ${turns} ターンで揃えました！`;
                        break; 
                    }
                }
            }
        }

        if (solved) {
            clearMessageElement.textContent = message;
            clearModal.classList.add('visible');
        }
    }
    function hideClearModal() { clearModal.classList.remove('visible'); }

    const scrambleBaseMoves = ['F', 'U', 'R', 'L', 'B', 'D'];
    const scrambleModifiers = ['', '_CCW', '_2'];

    function generateScrambleSequence() {
        const numMoves = 20 + Math.floor(prng_random() * 11); 
        let sequence = []; 
        let lastMoveBase = null;
        let secondLastMoveBase = null;

        for (let i = 0; i < numMoves; i++) {
            let moveIndex;
            let currentMoveBase;
            do {
                moveIndex = Math.floor(prng_random() * scrambleBaseMoves.length);
                currentMoveBase = scrambleBaseMoves[moveIndex];
            } while (currentMoveBase === lastMoveBase || (currentMoveBase === getOppositeFace(lastMoveBase) && currentMoveBase === secondLastMoveBase) );
            
            secondLastMoveBase = lastMoveBase;
            lastMoveBase = currentMoveBase;
            
            const modifier = scrambleModifiers[Math.floor(prng_random() * scrambleModifiers.length)];
            sequence.push(currentMoveBase + modifier);
        }
        return sequence;
    }
    
    function getOppositeFace(face) {
        const opposites = { F: 'B', B: 'F', U: 'D', D: 'U', L: 'R', R: 'L' };
        return opposites[face];
    }

    function scrambleCube(seed) {
        hideClearModal();
        currentSeed = typeof seed === 'string' ? seed.trim() : '';
        let seedToUse = Math.floor(Date.now() * Math.random()) + 1; 
        if (currentSeed !== '') {
            seedToUse = 0;
            for (let i = 0; i < currentSeed.length; i++) 
                seedToUse = (seedToUse + currentSeed.charCodeAt(i) * (i + 1)) % 2147483647;
            if(seedToUse <= 0) seedToUse += 2147483646;
            if(seedToUse === 0) seedToUse = 1;
        }
        prng_sRandom(seedToUse);

        cubeState = getInitialCubeState();
        const sequence = generateScrambleSequence();
        sequence.forEach(move => applyRotationAndUpdate(move));
        turns = 0;
        renderCube();
    }
    
    const svgIconCW = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    const svgIconCCW = `<svg viewBox="0 0 24 24" fill="currentColor" style="transform: scaleX(-1);"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;

    const faceButtonLabels = { F: '前面', U: '上面', R: '右面', L: '左面', B: '背面', D: '下面' };
    controlsGrid.innerHTML = ''; 

    faceKeys.forEach(faceKey => {
        const group = document.createElement('div');
        group.classList.add('face-control-group');

        const label = document.createElement('div');
        label.classList.add('face-control-group-label');
        label.textContent = `${faceButtonLabels[faceKey]} (${faceKey})`;
        group.appendChild(label);

        const buttonsPair = document.createElement('div');
        buttonsPair.classList.add('face-control-buttons');

        [{mod: '', icon: svgIconCW, aria: '時計回り'}, {mod: '_CCW', icon: svgIconCCW, aria: '反時計回り'}].forEach(op => {
            const move = faceKey + op.mod;
            const button = document.createElement('button');
            button.classList.add('control-button-sm');
            button.dataset.action = move;
            button.innerHTML = op.icon;
            button.setAttribute('aria-label', `${faceButtonLabels[faceKey]} ${op.aria}`);
            button.addEventListener('click', () => handleRotation(move));
            buttonsPair.appendChild(button);
        });
        group.appendChild(buttonsPair);
        controlsGrid.appendChild(group);
    });
    
    generateCubeButton.addEventListener('click', () => scrambleCube(seedInputElement.value));
    newGameFromModalButton.addEventListener('click', () => {
        hideClearModal(); seedInputElement.value = ""; scrambleCube("");
    });
    closeModalButton.addEventListener('click', hideClearModal);
    clearModal.addEventListener('click', (e) => { if (e.target === clearModal) hideClearModal(); });
    gameModeSelect.addEventListener('change', (e) => {
        currentGameMode = e.target.value;
        updateModeDisplay();
        scrambleCube(seedInputElement.value || ""); 
    });

    updateModeDisplay();
    scrambleCube("");
});
