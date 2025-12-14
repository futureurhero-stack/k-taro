// 카드 데이터와 상태 관리
let cardsData = [];
let selectedCardCount = 0;
let selectedCards = []; // 사용자가 선택한 카드들
let allCardsShuffled = []; // 셔플된 전체 카드

// 카드 위치 레이블 (3장, 5장 스프레드용)
const positionLabels = {
    1: ['현재'],
    3: ['과거', '현재', '미래'],
    5: ['과거', '현재', '미래', '조언', '결과']
};

// 오디오 요소
let bgMusic, cardShuffleSound, cardSelectSound;

// 모바일 감지
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let currentCardPage = 0;
const cardsPerPage = 10;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await loadCardsData();
    setupAudio();
    setupEventListeners();
});

// 오디오 설정
function setupAudio() {
    bgMusic = document.getElementById('bgMusic');
    cardShuffleSound = document.getElementById('cardShuffleSound');
    cardSelectSound = document.getElementById('cardSelectSound');
    
    // 배경음악 자동 재생 시도 (사용자 인터랙션 후)
    if (bgMusic) {
        bgMusic.volume = 0.3; // 볼륨 조절
        
        // 첫 클릭 시 배경음악 시작
        document.addEventListener('click', () => {
            if (bgMusic && bgMusic.readyState >= 2 && bgMusic.paused) {
                bgMusic.play().catch(e => console.log('배경음악 재생 실패 (파일이 없을 수 있습니다):', e));
            }
        }, { once: true });
    }
    
    if (cardShuffleSound) {
        cardShuffleSound.volume = 0.6;
    }
    
    if (cardSelectSound) {
        cardSelectSound.volume = 0.4;
    }
}

// 카드 데이터 로드
async function loadCardsData() {
    try {
        const response = await fetch('card.json');
        cardsData = await response.json();
        
        // 이미지 경로 수정 (cards/ -> finalcard_78/)
        cardsData = cardsData.map(card => {
            // 이미지 경로 수정
            let imagePath = card.image.replace('cards/', 'finalcard_78/');
            
            // 마이너 아르카나 코트 카드 파일명 수정
            if (imagePath.includes('_page.jpg')) {
                imagePath = imagePath.replace('_page.jpg', '_11.jpg');
            } else if (imagePath.includes('_knight.jpg')) {
                imagePath = imagePath.replace('_knight.jpg', '_12.jpg');
            } else if (imagePath.includes('_queen.jpg')) {
                imagePath = imagePath.replace('_queen.jpg', '_13.jpg');
            } else if (imagePath.includes('_king.jpg')) {
                imagePath = imagePath.replace('_king.jpg', '_14.jpg');
            }
            
            return {
                ...card,
                image: imagePath
            };
        });
        
        console.log('카드 데이터 로드 완료:', cardsData.length, '장');
    } catch (error) {
        console.error('카드 데이터 로드 실패:', error);
        alert('카드 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 모드 선택 버튼 - 이벤트 위임 사용
    const modeSelection = document.getElementById('modeSelection');
    if (modeSelection) {
        modeSelection.addEventListener('click', (e) => {
            // 클릭된 요소가 버튼이거나 버튼의 자식인지 확인
            const modeBtn = e.target.closest('.mode-btn');
            if (modeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const mode = modeBtn.dataset.mode;
                const modeName = modeBtn.dataset.name;
                console.log('모드 선택됨:', mode, modeName);
                selectedCardCount = parseInt(mode);
                selectMode(modeName);
            }
        });
    }

    // 선택 완료 버튼
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmSelection);
    }

    // 다시 뽑기 버튼
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCards);
    }
    
    // 모바일 스와이프 이벤트
    if (isMobile) {
        setupSwipeEvents();
    }
}

// 모드 선택
function selectMode(modeName) {
    console.log('selectMode 호출됨:', modeName, '선택된 카드 수:', selectedCardCount);
    
    // 모드 선택 화면 숨기기
    const modeSelection = document.getElementById('modeSelection');
    if (modeSelection) {
        modeSelection.style.display = 'none';
    }
    
    // 카드 섞는 화면 표시
    const shufflingScreen = document.getElementById('shufflingScreen');
    if (shufflingScreen) {
        shufflingScreen.style.display = 'block';
    }
    
    // 카드 섞기 효과음 재생
    if (cardShuffleSound) {
        cardShuffleSound.currentTime = 0;
        cardShuffleSound.play().catch(e => console.log('효과음 재생 실패:', e));
    }
    
    // 카드 섞기 애니메이션 후 카드 표시
    setTimeout(() => {
        if (shufflingScreen) {
            shufflingScreen.style.display = 'none';
        }
        spreadAllCards();
    }, 2000); // 2초간 섞기 애니메이션
}

// 모바일 스와이프 이벤트 설정
function setupSwipeEvents() {
    let container = null;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    
    // 컨테이너가 생성된 후 이벤트 리스너 추가
    const observer = new MutationObserver(() => {
        container = document.getElementById('allCardsContainer');
        if (container && !container.hasAttribute('data-swipe-setup')) {
            container.setAttribute('data-swipe-setup', 'true');
            
            container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = true;
            }, { passive: true });
            
            container.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
            }, { passive: true });
            
            container.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                
                const diffX = startX - currentX;
                const diffY = Math.abs(startY - (startY || 0));
                const threshold = 50;
                
                // 수평 스와이프가 수직 스와이프보다 큰 경우만 처리
                if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0) {
                        // 오른쪽으로 스와이프 (다음 페이지)
                        nextCardPage();
                    } else {
                        // 왼쪽으로 스와이프 (이전 페이지)
                        prevCardPage();
                    }
                }
            }, { passive: true });
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// 다음 카드 페이지
function nextCardPage() {
    const totalPages = Math.ceil(allCardsShuffled.length / cardsPerPage);
    if (currentCardPage < totalPages - 1) {
        currentCardPage++;
        showCardPage(currentCardPage);
    }
}

// 이전 카드 페이지
function prevCardPage() {
    if (currentCardPage > 0) {
        currentCardPage--;
        showCardPage(currentCardPage);
    }
}

// 특정 페이지의 카드 표시
function showCardPage(page) {
    const container = document.getElementById('allCardsContainer');
    const cards = Array.from(container.querySelectorAll('.selectable-card'));
    const startIndex = page * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, cards.length);
    
    // 모든 카드 숨기기
    cards.forEach((card) => {
        card.style.display = 'none';
    });
    
    // 현재 페이지의 카드만 표시
    cards.slice(startIndex, endIndex).forEach((card) => {
        card.style.display = 'block';
    });
    
    // 스와이프 인디케이터 업데이트
    const indicator = document.getElementById('swipeIndicator');
    if (indicator) {
        const totalPages = Math.ceil(cards.length / cardsPerPage);
        indicator.textContent = `← ${page + 1} / ${totalPages} →`;
    }
    
    // 컨테이너를 현재 페이지로 스크롤
    if (container && cards[startIndex]) {
        cards[startIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
}

// 78장 카드 뿌리기
function spreadAllCards() {
    if (cardsData.length === 0) {
        alert('카드 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    // 선택 초기화
    selectedCards = [];
    currentCardPage = 0;
    
    // 선택 안내 표시
    const guide = document.getElementById('selectionGuide');
    guide.style.display = 'block';
    document.getElementById('selectedCount').textContent = '0';
    document.getElementById('totalCount').textContent = selectedCardCount;
    document.getElementById('confirmBtn').style.display = 'none';
    
    // 기존 카드 제거
    const allCardsWrapper = document.getElementById('allCardsWrapper');
    const allCardsContainer = document.getElementById('allCardsContainer');
    allCardsContainer.innerHTML = '';
    
    const selectedContainer = document.getElementById('selectedCardsContainer');
    selectedContainer.innerHTML = '';
    selectedContainer.style.display = 'none';
    
    document.getElementById('interpretation').innerHTML = '';
    document.getElementById('interpretation').classList.remove('show');
    document.getElementById('resetSection').style.display = 'none';
    
    // 카드 셔플
    allCardsShuffled = [...cardsData].sort(() => Math.random() - 0.5);
    
    // 카드 컨테이너 표시
    allCardsWrapper.style.display = 'block';
    
    // PC/모바일 구분하여 카드 표시
    if (isMobile) {
        allCardsContainer.style.display = 'flex';
        allCardsContainer.style.overflowX = 'auto';
        allCardsContainer.style.flexWrap = 'nowrap';
        allCardsContainer.style.gap = '10px';
        allCardsContainer.style.scrollSnapType = 'x mandatory';
        allCardsContainer.style.webkitOverflowScrolling = 'touch';
    } else {
        allCardsContainer.style.display = 'grid';
        allCardsContainer.style.overflowX = 'visible';
    }
    
    // 카드들을 애니메이션과 함께 표시
    allCardsShuffled.forEach((card, index) => {
        setTimeout(() => {
            createCardElement(card, index, allCardsContainer, true);
        }, index * 15); // 순차적으로 나타나도록
    });
    
    // 모바일에서는 첫 페이지만 표시하고 스와이프 인디케이터 표시
    if (isMobile) {
        setTimeout(() => {
            showCardPage(0);
        }, allCardsShuffled.length * 15 + 100);
        
        const indicator = document.getElementById('swipeIndicator');
        if (indicator) {
            const totalPages = Math.ceil(allCardsShuffled.length / cardsPerPage);
            indicator.textContent = `← 1 / ${totalPages} →`;
            indicator.style.display = 'block';
        }
    } else {
        const indicator = document.getElementById('swipeIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
}

// 카드 요소 생성
function createCardElement(card, index, container, isSelectable = false) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-wrapper selectable-card';
    cardWrapper.dataset.cardId = card.id;
    
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    
    // 카드 앞면 (뒷면 이미지)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-face card-front';
    
    // 카드 뒷면 (카드 이미지)
    const cardBack = document.createElement('div');
    cardBack.className = 'card-face card-back';
    const cardImage = document.createElement('img');
    cardImage.src = card.image;
    cardImage.alt = card.name;
    cardBack.appendChild(cardImage);
    
    cardElement.appendChild(cardFront);
    cardElement.appendChild(cardBack);
    cardWrapper.appendChild(cardElement);
    
    // 선택 가능한 카드인 경우 클릭 이벤트 추가
    if (isSelectable) {
        cardWrapper.addEventListener('click', () => {
            toggleCardSelection(card, cardWrapper);
        });
        
        // 호버 효과
        cardWrapper.style.cursor = 'pointer';
    }
    
    container.appendChild(cardWrapper);
    
    // 카드 나타나는 애니메이션
    setTimeout(() => {
        cardWrapper.style.opacity = '1';
        cardWrapper.style.transform = 'scale(1) rotate(0deg)';
    }, 10);
}

// 카드 선택 토글
function toggleCardSelection(card, cardWrapper) {
    const cardId = card.id;
    const index = selectedCards.findIndex(c => c.id === cardId);
    
    if (index !== -1) {
        // 이미 선택된 카드면 해제
        selectedCards.splice(index, 1);
        cardWrapper.classList.remove('selected');
        cardWrapper.style.transform = 'scale(1)';
    } else {
        // 선택 개수 확인
        if (selectedCards.length >= selectedCardCount) {
            alert(`최대 ${selectedCardCount}장까지만 선택할 수 있습니다.`);
            return;
        }
        
        // 카드 선택
        const isReversed = Math.random() < 0.5; // 50% 확률로 역방향
        selectedCards.push({
            ...card,
            isReversed,
            position: positionLabels[selectedCardCount][selectedCards.length]
        });
        
        cardWrapper.classList.add('selected');
        cardWrapper.style.transform = 'scale(0.9)';
        
        // 효과음 재생
        if (cardSelectSound && cardSelectSound.readyState >= 2) {
            cardSelectSound.currentTime = 0;
            cardSelectSound.play().catch(e => console.log('효과음 재생 실패:', e));
        }
    }
    
    // 선택 개수 업데이트
    updateSelectionCount();
}

// 선택 개수 업데이트
function updateSelectionCount() {
    const selectedCountEl = document.getElementById('selectedCount');
    const totalCountEl = document.getElementById('totalCount');
    const confirmBtn = document.getElementById('confirmBtn');
    
    selectedCountEl.textContent = selectedCards.length;
    totalCountEl.textContent = selectedCardCount;
    
    if (selectedCards.length === selectedCardCount) {
        confirmBtn.style.display = 'block';
    } else {
        confirmBtn.style.display = 'none';
    }
}

// 선택 완료
function confirmSelection() {
    if (selectedCards.length !== selectedCardCount) {
        alert(`정확히 ${selectedCardCount}장을 선택해주세요.`);
        return;
    }
    
    // 전체 카드 숨기기
    document.getElementById('allCardsContainer').style.display = 'none';
    document.getElementById('selectionGuide').style.display = 'none';
    
    // 선택된 카드 표시
    displaySelectedCards();
    
    // 해석 표시
    setTimeout(() => {
        displayInterpretation();
    }, 500);
}

// 선택된 카드 표시
function displaySelectedCards() {
    const selectedContainer = document.getElementById('selectedCardsContainer');
    selectedContainer.innerHTML = '';
    selectedContainer.style.display = 'flex';
    
    selectedCards.forEach((card, index) => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-wrapper';
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card flipped';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-face card-front';
        
        const cardBack = document.createElement('div');
        cardBack.className = `card-face card-back ${card.isReversed ? 'reversed' : ''}`;
        const cardImage = document.createElement('img');
        cardImage.src = card.image;
        cardImage.alt = card.name;
        cardBack.appendChild(cardImage);
        
        const cardLabel = document.createElement('div');
        cardLabel.className = `card-label ${card.isReversed ? 'reversed' : ''}`;
        cardLabel.textContent = card.isReversed ? '역방향' : '정방향';
        
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        cardWrapper.appendChild(cardElement);
        cardWrapper.appendChild(cardLabel);
        
        selectedContainer.appendChild(cardWrapper);
        
        // 순차적으로 나타나는 애니메이션
        setTimeout(() => {
            cardWrapper.style.opacity = '1';
            cardWrapper.style.transform = 'scale(1)';
        }, index * 200);
    });
}

// 카드 그림 설명 가져오기 함수
function getCardImageDescription(cardName) {
    const descriptions = {
        // 메이저 아르카나
        'The Fool': '이 카드에는 한복을 입은 순수한 인물이 새로운 여정을 시작하는 모습이 그려져 있어요. 배낭을 메고 앞을 향해 걸어가는 모습은 새로운 시작과 무한한 가능성을 상징합니다.',
        'The Magician': '한복을 입은 마법사가 손에 도구를 들고 있는 모습이 보입니다. 이는 의지와 창조의 힘, 그리고 목표를 이루기 위한 준비된 상태를 나타내요.',
        'The High Priestess': '신비로운 한복을 입은 여인이 지혜의 두루마리를 들고 있는 모습입니다. 직관과 감춰진 지식을 상징하며, 내면의 목소리에 귀 기울이라는 메시지를 전해요.',
        'The Empress': '풍요로운 한복을 입은 여황후가 자연과 함께 있는 모습이 그려져 있어요. 풍요, 모성애, 그리고 창조력을 나타내며 생명력과 성장을 상징합니다.',
        'The Emperor': '위엄 있는 한복을 입은 황제가 권좌에 앉아 있는 모습입니다. 안정, 구조, 그리고 리더십을 나타내며 권위와 질서를 상징해요.',
        'The Hierophant': '전통적인 한복을 입은 스승이 제자들에게 가르침을 전하는 모습이 보입니다. 전통, 교육, 그리고 영적 지도를 나타내며 지혜의 전수를 상징해요.',
        'The Lovers': '한복을 입은 두 사람이 서로를 바라보는 모습입니다. 사랑과 조화를 나타내며, 중요한 선택의 순간을 상징합니다.',
        'The Chariot': '전차를 타고 있는 한복을 입은 인물의 모습이 그려져 있어요. 의지력과 성공을 나타내며, 목표를 향한 전진을 상징합니다.',
        'Strength': '한복을 입은 인물이 내면의 힘으로 상황을 다루는 모습입니다. 인내와 용기, 그리고 부드러운 힘을 나타내요.',
        'The Hermit': '등불을 든 한복을 입은 은둔자가 홀로 있는 모습이 보입니다. 고독과 내면 탐색, 그리고 지혜를 상징해요.',
        'Wheel of Fortune': '운명의 바퀴가 돌아가는 모습이 한복 테마로 그려져 있습니다. 운명의 전환점과 변화를 나타내며, 인생의 순환을 상징합니다.',
        'Justice': '저울을 든 한복을 입은 정의의 여신이 그려져 있어요. 균형과 정의, 그리고 명확한 판단을 상징합니다.',
        'The Hanged Man': '거꾸로 매달린 한복을 입은 인물의 모습입니다. 희생과 새로운 시각, 그리고 멈춤을 나타내며 다른 관점의 필요를 상징해요.',
        'Death': '한복을 입은 인물이 변화의 순간을 맞이하는 모습이 그려져 있습니다. 끝과 시작, 그리고 해방을 나타내며 새로운 시작을 상징합니다.',
        'Temperance': '두 그릇 사이에서 균형을 잡는 한복을 입은 인물의 모습입니다. 조화와 치유, 그리고 균형을 상징해요.',
        'The Devil': '속박에 묶인 한복을 입은 인물들의 모습이 보입니다. 집착과 중독, 그리고 억압을 나타내며 자유의 상실을 상징합니다.',
        'The Tower': '번개에 맞아 무너지는 탑과 한복을 입은 인물들의 모습입니다. 충격과 붕괴, 그리고 갑작스런 변화를 상징해요.',
        'The Star': '별 아래에서 물을 따르는 한복을 입은 인물의 모습이 그려져 있어요. 희망과 치유, 그리고 영감을 나타냅니다.',
        'The Moon': '달빛 아래 한복을 입은 인물이 길을 걷는 모습입니다. 무의식과 환상, 그리고 직관을 상징하며 불확실성을 나타내요.',
        'The Sun': '밝은 태양 아래 한복을 입은 아이가 즐거워하는 모습이 보입니다. 행복과 명확함, 그리고 성공을 상징합니다.',
        'Judgement': '나팔 소리와 함께 부활하는 한복을 입은 인물들의 모습입니다. 자각과 부름, 그리고 재생을 나타내며 새로운 시작을 상징해요.',
        'The World': '세계를 상징하는 원 안에 한복을 입은 인물이 그려져 있습니다. 완성과 통합, 그리고 성취를 나타내며 여정의 완주를 상징합니다.',
        
        // 마이너 아르카나 - 붓 (Wands)
        'Ace of Wands': '한 손에 붓을 든 모습이 그려져 있어요. 새로운 영감과 창조의 시작을 상징합니다.',
        'Two of Wands': '두 개의 붓이 교차하거나 나란히 있는 모습입니다. 계획과 전망, 그리고 전략적 선택을 나타내요.',
        'Three of Wands': '세 개의 붓이 함께 있는 모습이 보입니다. 전망과 진보, 그리고 확장을 상징합니다.',
        'Four of Wands': '네 개의 붓이 축하의 장면을 이루고 있어요. 축하와 조화, 그리고 성취감을 나타냅니다.',
        'Five of Wands': '다섯 개의 붓이 서로 겨루는 모습입니다. 경쟁과 갈등, 그리고 도전을 상징해요.',
        'Six of Wands': '승리를 상징하는 여섯 개의 붓이 그려져 있어요. 승리와 인식, 그리고 성취를 나타냅니다.',
        'Seven of Wands': '일곱 개의 붓으로 방어하는 모습이 보입니다. 방어와 도전, 그리고 신념 지키기를 상징합니다.',
        'Eight of Wands': '여덟 개의 붓이 빠르게 날아가는 모습입니다. 빠른 움직임과 진행, 그리고 커뮤니케이션을 나타내요.',
        'Nine of Wands': '아홉 개의 붓으로 방어 준비를 하는 모습이 그려져 있어요. 회복력과 인내, 그리고 방어 준비를 상징합니다.',
        'Ten of Wands': '열 개의 붓을 짊어진 무거운 모습입니다. 과중한 부담과 책임, 그리고 노력의 끝을 나타냅니다.',
        'Page of Wands': '한복을 입은 동자/동녀가 붓을 들고 있는 모습이 보입니다. 열정과 발견, 그리고 창조적 에너지를 상징해요.',
        'Knight of Wands': '한복을 입은 선비가 붓을 들고 달려가는 모습입니다. 행동력과 모험심, 그리고 추진력을 나타냅니다.',
        'Queen of Wands': '한복을 입은 궁주가 붓을 우아하게 들고 있는 모습이 그려져 있어요. 자신감과 활력, 그리고 사회성을 상징합니다.',
        'King of Wands': '한복을 입은 대감이 붓을 권위 있게 들고 있는 모습입니다. 리더십과 비전, 그리고 영향력을 나타내요.',
        
        // 마이너 아르카나 - 다기 (Cups)
        'Ace of Cups': '한 손에 다기를 든 모습이 그려져 있어요. 새로운 감정과 사랑, 그리고 직관의 시작을 상징합니다.',
        'Two of Cups': '두 개의 다기가 마주하는 모습입니다. 파트너십과 조화, 그리고 감정 교류를 나타내요.',
        'Three of Cups': '세 개의 다기가 함께 있는 모습이 보입니다. 축하와 우정, 그리고 공동체를 상징합니다.',
        'Four of Cups': '네 개의 다기 중 하나를 무시하는 모습이 그려져 있어요. 무관심과 자기 반성, 그리고 제안 무시를 나타냅니다.',
        'Five of Cups': '다섯 개의 다기 중 일부가 엎어진 모습입니다. 상실과 후회, 그리고 실망을 상징해요.',
        'Six of Cups': '여섯 개의 다기가 추억을 상징하는 모습이 보입니다. 추억과 순수함, 그리고 과거의 기쁨을 나타냅니다.',
        'Seven of Cups': '일곱 개의 다기가 환상을 보여주는 모습이 그려져 있어요. 환상과 선택, 그리고 상상력을 상징합니다.',
        'Eight of Cups': '여덟 개의 다기를 뒤로 하고 떠나는 모습입니다. 이탈과 새로운 여정, 그리고 실망 후 전환을 나타내요.',
        'Nine of Cups': '아홉 개의 다기가 만족을 상징하는 모습이 보입니다. 감정적 만족과 소원 성취, 그리고 즐거움을 상징해요.',
        'Ten of Cups': '열 개의 다기가 가족의 행복을 나타내는 모습입니다. 가족과 조화, 그리고 영적 충만함을 나타냅니다.',
        'Page of Cups': '한복을 입은 동자/동녀가 다기를 들고 있는 모습이 그려져 있어요. 창의성과 감정 표현, 그리고 메시지를 상징합니다.',
        'Knight of Cups': '한복을 입은 선비가 다기를 들고 있는 모습입니다. 로맨스와 이상주의, 그리고 제안을 나타내요.',
        'Queen of Cups': '한복을 입은 궁주가 다기를 우아하게 들고 있는 모습이 보입니다. 공감과 직관, 그리고 감정적 안정을 상징해요.',
        'King of Cups': '한복을 입은 대감이 다기를 권위 있게 들고 있는 모습입니다. 감정적 균형과 배려심, 그리고 성숙함을 나타냅니다.',
        
        // 마이너 아르카나 - 부채 (Swords)
        'Ace of Swords': '한 손에 부채를 든 모습이 그려져 있어요. 진실과 명료성, 그리고 새로운 지성을 상징합니다.',
        'Two of Swords': '두 개의 부채가 교차하는 모습입니다. 결정과 균형, 그리고 중립적 입장을 나타내요.',
        'Three of Swords': '세 개의 부채가 심장을 꿰뚫는 모습이 보입니다. 상처와 배신, 그리고 마음의 아픔을 상징합니다.',
        'Four of Swords': '네 개의 부채가 휴식을 상징하는 모습이 그려져 있어요. 휴식과 재충전, 그리고 내면의 평화를 나타냅니다.',
        'Five of Swords': '다섯 개의 부채가 갈등을 나타내는 모습입니다. 갈등과 이기심, 그리고 승리의 대가를 상징해요.',
        'Six of Swords': '여섯 개의 부채가 이동을 상징하는 모습이 보입니다. 이동과 전환, 그리고 치유의 여정을 나타냅니다.',
        'Seven of Swords': '일곱 개의 부채가 기만을 상징하는 모습이 그려져 있어요. 기만과 전략, 그리고 독립적 행동을 상징합니다.',
        'Eight of Swords': '여덟 개의 부채에 속박된 모습입니다. 제한과 속박, 그리고 무기력을 나타내요.',
        'Nine of Swords': '아홉 개의 부채가 불안을 상징하는 모습이 보입니다. 불안과 악몽, 그리고 스트레스를 상징해요.',
        'Ten of Swords': '열 개의 부채가 등에 꽂힌 모습입니다. 끝장과 배신, 그리고 고통의 극치를 나타냅니다.',
        'Page of Swords': '한복을 입은 동자/동녀가 부채를 들고 있는 모습이 그려져 있어요. 호기심과 관찰, 그리고 새로운 아이디어를 상징합니다.',
        'Knight of Swords': '한복을 입은 선비가 부채를 들고 달려가는 모습입니다. 결단력과 추진력, 그리고 명확한 목표를 나타내요.',
        'Queen of Swords': '한복을 입은 궁주가 부채를 우아하게 들고 있는 모습이 보입니다. 지혜와 독립성, 그리고 명료한 사고를 상징해요.',
        'King of Swords': '한복을 입은 대감이 부채를 권위 있게 들고 있는 모습입니다. 지성과 논리, 그리고 권위 있는 판단을 나타냅니다.',
        
        // 마이너 아르카나 - 옥/노리개 (Pentacles)
        'Ace of Pentacles': '한 손에 옥(노리개)을 든 모습이 그려져 있어요. 새로운 기회와 물질적 시작, 그리고 풍요의 씨앗을 상징합니다.',
        'Two of Pentacles': '두 개의 옥(노리개)이 균형을 이루는 모습입니다. 균형 잡기와 유연함, 그리고 다중 작업을 나타내요.',
        'Three of Pentacles': '세 개의 옥(노리개)이 협업을 상징하는 모습이 보입니다. 협업과 기술, 그리고 공동 창작을 상징합니다.',
        'Four of Pentacles': '네 개의 옥(노리개)을 지키는 모습이 그려져 있어요. 소유와 안정, 그리고 절약을 나타냅니다.',
        'Five of Pentacles': '다섯 개의 옥(노리개)이 결핍을 나타내는 모습입니다. 결핍과 상실, 그리고 소외를 상징해요.',
        'Six of Pentacles': '여섯 개의 옥(노리개)이 나눔을 상징하는 모습이 보입니다. 나눔과 관대함, 그리고 균형 잡힌 교환을 나타냅니다.',
        'Seven of Pentacles': '일곱 개의 옥(노리개)이 기다림을 상징하는 모습이 그려져 있어요. 기다림과 장기적 관점, 그리고 인내를 상징합니다.',
        'Eight of Pentacles': '여덟 개의 옥(노리개)이 노력을 나타내는 모습입니다. 노력과 기술 연마, 그리고 장인정신을 나타내요.',
        'Nine of Pentacles': '아홉 개의 옥(노리개)이 자립을 상징하는 모습이 보입니다. 자립과 물질적 풍요, 그리고 성취를 상징해요.',
        'Ten of Pentacles': '열 개의 옥(노리개)이 가문을 상징하는 모습입니다. 유산과 가족, 그리고 장기적 안정을 나타냅니다.',
        'Page of Pentacles': '한복을 입은 동자/동녀가 옥(노리개)을 들고 있는 모습이 그려져 있어요. 학습과 기회 발견, 그리고 실용적 아이디어를 상징합니다.',
        'Knight of Pentacles': '한복을 입은 선비가 옥(노리개)을 들고 있는 모습입니다. 책임감과 끈기, 그리고 꾸준한 진전을 나타내요.',
        'Queen of Pentacles': '한복을 입은 궁주가 옥(노리개)을 우아하게 들고 있는 모습이 보입니다. 현실감각과 풍요, 그리고 양육을 상징해요.',
        'King of Pentacles': '한복을 입은 대감이 옥(노리개)을 권위 있게 들고 있는 모습입니다. 부와 안정, 그리고 신뢰할 수 있는 지도자를 나타냅니다.'
    };
    
    return descriptions[cardName] || '이 카드에는 한복 테마로 재해석된 아름다운 그림이 그려져 있어요.';
}

// 해석을 자연스럽게 변환하는 함수
function formatInterpretation(card, position, isLast) {
    const isReversed = card.isReversed;
    const baseMeaning = isReversed ? card.reversed : card.upright;
    const meanings = baseMeaning.split(', ');
    
    // 카드 그림 설명 추가
    const imageDescription = getCardImageDescription(card.name);
    
    // 위치에 따른 자연스러운 인사말
    let intro = '';
    if (selectedCardCount === 1) {
        const intros = [
            '이 카드가 당신에게 전하는 메시지를 살펴보면,',
            '이 카드를 통해 보이는 것은,',
            '이 카드가 말하고자 하는 것은,'
        ];
        intro = intros[Math.floor(Math.random() * intros.length)];
    } else {
        switch(position) {
            case '과거':
                intro = '과거를 되돌아보면,';
                break;
            case '현재':
                intro = '지금 이 순간 당신의 상황은,';
                break;
            case '미래':
                intro = '앞으로 펼쳐질 미래에는,';
                break;
            case '조언':
                intro = '이 카드가 당신에게 건네는 조언은,';
                break;
            case '결과':
                intro = '이 상황이 가져올 결과는,';
                break;
            default:
                intro = '이 카드가 보여주는 것은,';
        }
    }
    
    // 의미를 자연스러운 문장으로 변환
    let explanation = '';
    if (meanings.length === 1) {
        explanation = meanings[0] + '을(를) 의미하고 있어요.';
    } else if (meanings.length === 2) {
        explanation = meanings[0] + '과(와) ' + meanings[1] + '을(를) 나타내고 있습니다.';
    } else {
        const lastMeaning = meanings[meanings.length - 1];
        const otherMeanings = meanings.slice(0, -1).join(', ');
        explanation = otherMeanings + ', 그리고 ' + lastMeaning + '을(를) 의미하고 있어요.';
    }
    
    // 방향에 따른 자연스러운 추가 설명
    let directionNote = '';
    if (isReversed) {
        const reversedNotes = [
            ' 역방향으로 나온 이 카드는, 현재 상황이 예상과 다르게 흘러가고 있거나 주의가 필요하다는 신호예요.',
            ' 역방향으로 나온 이 카드는, 에너지가 막혀있거나 방향 전환이 필요할 수 있다는 의미입니다.',
            ' 역방향으로 나온 이 카드는, 지금은 조금 더 신중하게 접근해야 할 때일 수 있어요.'
        ];
        directionNote = reversedNotes[Math.floor(Math.random() * reversedNotes.length)];
    } else {
        const uprightNotes = [
            ' 정방향으로 나온 이 카드는, 긍정적인 에너지가 잘 흐르고 있다는 좋은 신호예요.',
            ' 정방향으로 나온 이 카드는, 현재 상황이 순조롭게 진행되고 있다는 의미입니다.',
            ' 정방향으로 나온 이 카드는, 당신의 길이 열려있다는 것을 보여주고 있어요.'
        ];
        directionNote = uprightNotes[Math.floor(Math.random() * uprightNotes.length)];
    }
    
    // 전체 해석 구성
    let fullInterpretation = '';
    
    // 카드 그림 설명 먼저 추가
    fullInterpretation += imageDescription + ' ';
    fullInterpretation += '\n\n';
    
    // 위치별 인사말과 의미
    fullInterpretation += intro + ' ';
    fullInterpretation += explanation;
    fullInterpretation += directionNote;
    
    // 추가 조언 (카드에 따라)
    if (selectedCardCount > 1 && !isLast) {
        fullInterpretation += ' 이제 다음 카드를 함께 살펴보면 더 명확해질 거예요.';
    } else if (isLast && selectedCardCount > 1) {
        fullInterpretation += ' 모든 카드를 종합해보면, 당신의 상황에 대한 전체적인 흐름을 파악할 수 있을 거예요.';
    }
    
    return fullInterpretation;
}

// 해석 표시 함수
function displayInterpretation() {
    const interpretationDiv = document.getElementById('interpretation');
    interpretationDiv.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = '📖 카드 해석';
    interpretationDiv.appendChild(title);
    
    // 전체 해석 소개 문구
    const introText = document.createElement('div');
    introText.className = 'interpretation-intro';
    const introMessages = selectedCardCount === 1 
        ? [
            '뽑으신 카드의 의미를 자세히 설명해드릴게요.',
            '이 카드가 당신에게 전하는 메시지를 함께 살펴보아요.',
            '카드가 보여주는 의미를 하나씩 풀어드리겠습니다.'
        ]
        : [
            '뽑으신 카드들을 순서대로 해석해드리겠습니다.',
            '각 카드의 의미를 차근차근 설명해드릴게요.',
            '카드들이 전하는 이야기를 함께 들어보아요.'
        ];
    introText.textContent = introMessages[Math.floor(Math.random() * introMessages.length)];
    interpretationDiv.appendChild(introText);
    
    selectedCards.forEach((card, index) => {
        const cardInterp = document.createElement('div');
        cardInterp.className = 'card-interpretation';
        
        // 위치 레이블 (1장이 아닌 경우)
        if (selectedCardCount > 1) {
            const position = document.createElement('span');
            position.className = 'position';
            position.textContent = card.position;
            cardInterp.appendChild(position);
            cardInterp.appendChild(document.createElement('br'));
        }
        
        // 카드 이름
        const cardName = document.createElement('div');
        cardName.className = 'card-name';
        cardName.textContent = card.name;
        cardInterp.appendChild(cardName);
        
        // 방향 레이블
        const direction = document.createElement('span');
        direction.className = 'direction';
        direction.textContent = card.isReversed ? '역방향' : '정방향';
        cardInterp.appendChild(direction);
        cardInterp.appendChild(document.createElement('br'));
        cardInterp.appendChild(document.createElement('br'));
        
        // 자연스러운 해석
        const meaning = document.createElement('div');
        meaning.className = 'meaning';
        const isLast = index === selectedCards.length - 1;
        const interpretationText = formatInterpretation(card, card.position, isLast);
        
        // 줄바꿈을 <br>로 변환하여 표시
        const lines = interpretationText.split('\n\n');
        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                meaning.appendChild(document.createElement('br'));
                meaning.appendChild(document.createElement('br'));
            }
            const lineDiv = document.createElement('div');
            lineDiv.textContent = line;
            lineDiv.style.marginBottom = lineIndex < lines.length - 1 ? '10px' : '0';
            meaning.appendChild(lineDiv);
        });
        
        cardInterp.appendChild(meaning);
        interpretationDiv.appendChild(cardInterp);
    });
    
    // 마무리 문구
    const closingText = document.createElement('div');
    closingText.className = 'interpretation-closing';
    const closingMessages = [
        '✨ 이 해석이 당신에게 도움이 되길 바랍니다.',
        '✨ 카드가 전하는 메시지를 마음에 새겨보세요.',
        '✨ 이 해석을 참고하시되, 자신의 직감도 믿어보세요.',
        '✨ 카드의 의미를 되새기며 앞으로 나아가시길 응원합니다.'
    ];
    closingText.textContent = closingMessages[Math.floor(Math.random() * closingMessages.length)];
    interpretationDiv.appendChild(closingText);
    
    interpretationDiv.classList.add('show');
    document.getElementById('resetSection').style.display = 'block';
    
    // 해석 영역으로 스크롤
    setTimeout(() => {
        interpretationDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 카드 리셋 함수
function resetCards() {
    selectedCards = [];
    selectedCardCount = 0;
    currentCardPage = 0;
    document.getElementById('allCardsWrapper').style.display = 'none';
    document.getElementById('allCardsContainer').innerHTML = '';
    document.getElementById('selectedCardsContainer').innerHTML = '';
    document.getElementById('selectedCardsContainer').style.display = 'none';
    document.getElementById('interpretation').innerHTML = '';
    document.getElementById('interpretation').classList.remove('show');
    document.getElementById('resetSection').style.display = 'none';
    document.getElementById('selectionGuide').style.display = 'none';
    document.getElementById('shufflingScreen').style.display = 'none';
    document.getElementById('modeSelection').style.display = 'block';
}
