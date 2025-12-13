# 오디오 파일 안내

이 폴더에 다음 오디오 파일들을 추가하시면 배경음악과 효과음이 재생됩니다.

## 필요한 파일

1. **background.mp3** (또는 .wav, .ogg)
   - 배경음악 파일
   - 반복 재생되는 한복 테마에 맞는 음악

2. **card-spread.wav** (또는 .mp3, .ogg)
   - 카드가 뿌려질 때 재생되는 효과음
   - 예: 종소리, 바람 소리 등

3. **card-select.wav** (또는 .mp3, .ogg)
   - 카드를 선택할 때 재생되는 효과음
   - 예: 클릭 소리, 종소리 등

## 사용 방법

1. 위 파일들을 이 폴더에 추가하세요.
2. `index.html` 파일에서 오디오 태그의 주석을 해제하고 파일 경로를 수정하세요.

예시:
```html
<audio id="bgMusic" loop>
    <source src="sounds/background.mp3" type="audio/mpeg">
</audio>
```

## 무료 오디오 리소스

- [Freesound](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [Mixkit](https://mixkit.co/free-sound-effects/)

## 참고

오디오 파일이 없어도 사이트는 정상적으로 작동합니다. 단지 배경음악과 효과음이 재생되지 않을 뿐입니다.


