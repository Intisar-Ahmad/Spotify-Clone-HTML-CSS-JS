let currenSong = new Audio();
let songs = [];
let currfolder = '';

// Universal Path Helper 
function getFolderNameFromUrl(href) {
    try {
        let decodedHref = decodeURIComponent(href);
        let normalizedHref = decodedHref.replace(/\\/g, "/"); // Fix Windows backslashes
        
        if (normalizedHref.includes("/songs/")) {
            let parts = normalizedHref.split("/songs/");
            let folderName = parts[1].replace("/", ""); 
            return folderName;
        }
        return null;
    } catch (e) {
        return null;
    }
}

(async function firstfolder() {
    try {
        let a = await fetch("http://127.0.0.1:3000/songs/");
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        
        let anchors = div.getElementsByTagName("a");
        for (const element of anchors) {
            let href = element.href;
            if (href.includes("../") || href.includes(".htaccess")) continue;

            if (href.includes("/songs/")) {
                let folder = getFolderNameFromUrl(href);
                if (folder) {
                    currfolder = folder;
                    await main();
                    break; 
                }
            }
        }
    } catch (error) {
        console.error("Error init:", error);
    }
})();

// gets all the songs from a folder
async function getData(folder) {
    currfolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    
    let as = div.getElementsByTagName("a");
    let songList = [];
    for (const element of as) {
        if (element.href.endsWith(".mp3")) {
            songList.push(element.href);
        }
    }
    return songList;
}

// plays a song
function playMusic(track, pause = false) {
    currenSong.src = track;
    
    // Fix song name display
    let decodedTrack = decodeURIComponent(track);
    let songName = decodedTrack.split(`/songs/${currfolder}/`)[1] || decodedTrack.split("/").pop();
    songName = songName.replace(".mp3", "").replace(/%20/g, " ");

    document.querySelector(".songinfo").innerHTML = songName;
    document.querySelector(".songtime2").innerText = "00:00 / 00:00";

    let play = document.querySelector(".playinsong");
    if (!pause) {
        currenSong.play();
        play.setAttribute("src", "/images/pause.svg");
        play.style.width = "18px";
    } else {
        play.setAttribute("src", "/images/play.svg");
        play.style.width = "30px";
    }
    
    let vol = document.getElementById("vol");
    currenSong.volume = vol.value / 100;
}

async function main() {
    songs = await getData(currfolder);
    playMusic(songs[0], true); // Load first song but pause it
    
    await displayAlbums();
    makelist();
    attachPlayerEvents();
}

function makelist() {
    let songUL = document.querySelector(".libararies ul");
    songUL.innerHTML = ""; 
    
    for (const song of songs) {
        let li = document.createElement("li");
        
        let decodedSong = decodeURIComponent(song);
        let songName = decodedSong.split(`/songs/${currfolder}/`)[1] || decodedSong.split("/").pop();
        songName = songName.replace(".mp3", "").replace(/%20/g, " ");

        li.innerHTML = `
            <div>
                <img src="/images/headphones.svg">
                <div class="info">${songName}</div>
            </div> 
            <div class="playnow">
                <img src="/images/play.svg"> Play Now 
            </div>`;
            
        let img = li.querySelectorAll("img");
        img[0].style.width = "15px"; img[0].style.filter = "invert(1)";
        img[1].style.width = "15px"; img[1].style.filter = "invert(1)";
        li.querySelector(".playnow").style.cursor = "pointer";

        li.addEventListener("click", () => {
            playMusic(song);
        })
        songUL.append(li);
    }
}

async function displayAlbums() {
    let a = await fetch("http://127.0.0.1:3000/songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    
    let anchors = Array.from(div.getElementsByTagName("a"));
    let cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = ""; 

    for (let e of anchors) {
        let href = e.href;
        if (href.includes("/songs/") && !href.includes(".htaccess") && !href.includes("../")) {
            let folder = getFolderNameFromUrl(href);
            if (!folder) continue;
            
            let randimg = Math.floor(Math.random() * 6) + 1;
            
            cardContainer.innerHTML += ` 
            <div data-folder="${folder}" class="card">
                <div class="play">
                    <img src="/images/play.svg">
                </div>
                <img src="/images/musicCover${randimg}.jpg" alt="cover">
                <h2>${decodeURIComponent(folder)}</h2>
            </div>`;
        }
    }

    // --- YOUR SPECIFIC CLICK LOGIC RESTORED ---
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        // Hover effects
        e.addEventListener("mouseover", () => {
             let playBtn = e.querySelector(".play");
             if(playBtn) playBtn.classList.add("appear");
        });
        e.addEventListener("mouseleave", () => {
             let playBtn = e.querySelector(".play");
             if(playBtn) playBtn.classList.remove("appear");
        });

        // 1. Click on Card Body -> Just Load List
        e.addEventListener("click", async item => {
            currfolder = item.currentTarget.dataset.folder;
            songs = await getData(currfolder);
            makelist(); 
        });

        // 2. Click on Green Play Button -> Load List AND Play Music
        let playButton = e.querySelector(".play");
        if(playButton){
            playButton.addEventListener("click", async (event) => {
                event.stopPropagation(); // Stop it from triggering the card click
                currfolder = e.dataset.folder;
                songs = await getData(currfolder);
                makelist(); 
                playMusic(songs[0]); // Immediately play
            });
        }
    });
}

function attachPlayerEvents() {
    let playbtn = document.querySelector(".playinsong");
    let prevbtn = document.querySelector(".prev");
    let nextbtn = document.querySelector(".next");

    playbtn.addEventListener("click", () => {
        if (currenSong.paused) {
            currenSong.play();
            playbtn.setAttribute("src", "/images/pause.svg");
            playbtn.style.width = "18px";
        } else {
            currenSong.pause();
            playbtn.setAttribute("src", "/images/play.svg");
            playbtn.style.width = "30px";
        }
    });

    currenSong.addEventListener("timeupdate", () => {
        let songtime = document.querySelector(".songtime2");
        let circle = document.querySelector(".circle");
        
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0) return "00:00";
            let mins = Math.floor(seconds / 60);
            let secs = Math.floor(seconds % 60);
            return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        songtime.innerHTML = `${formatTime(currenSong.currentTime)} / ${formatTime(currenSong.duration)}`;
        if(currenSong.duration) {
            circle.style.left = (currenSong.currentTime / currenSong.duration) * 100 + "%";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currenSong.currentTime = ((currenSong.duration) * percent) / 100;
    });

    // Spacebar to play/pause
    document.addEventListener("keydown", (event) => {
        if (event.code == 'Space') {
            playbtn.click();
        }
    });

    prevbtn.addEventListener("click", () => {
        let index = songs.indexOf(currenSong.src);
        if ((index - 1) >= 0) playMusic(songs[index - 1]);
    });

    nextbtn.addEventListener("click", () => {
        let index = songs.indexOf(currenSong.src);
        if ((index + 1) < songs.length) playMusic(songs[index + 1]);
    });

    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currenSong.volume = parseInt(e.target.value) / 100;
        let volImg = document.querySelector(".volume img");
        if(currenSong.volume > 0){
            volImg.src = currenSong.volume > 0.5 ? "/images/highvolume.svg" : "/images/lowvolume.svg";
        } else {
            volImg.src = "/images/novolume.svg";
        }
    });
}


let left = document.querySelector(".left");
let right = document.querySelector(".right");
let close = document.querySelector(".closeleft");
let open = document.querySelector(".openleft");
let mediaQuery = window.matchMedia("(max-width: 800px), (orientation: portrait)");

if (mediaQuery.matches) {
    left.style.transition = "transform 0.5s linear 0s";
    left.style.transform = "translateX(-120%)";
    right.style.position = "absolute";
    right.style.width = "100vw";
    left.style.width = "70vw";
    
    // Check duplication for reloading
    if(!document.querySelector(".internal-close-btn")){
        let home = document.querySelector(".home");
        let insideclose = document.createElement("div");
        insideclose.className = "internal-close-btn";
        insideclose.innerHTML = "<img src='/images/hamburger.svg' class='invert-colorandOpacity closeleft'>";
        Object.assign(insideclose.style, {
            display: "flex", alignItems: "center", cursor: "pointer", 
            position: "absolute", right: '10px', top: '10px'
        });
        home.append(insideclose);
        insideclose.addEventListener("click", () => {
            left.style.transform = "translateX(-120%)";
        });
    }
}

let turn = 0;
close.addEventListener("click", () => {
    if (!mediaQuery.matches && turn <= 0) {
        left.style.transform = "translateX(-120%)";
        right.style.position = "absolute";
        right.style.width = "100vw";
        turn++;
    }
});

open.addEventListener("click", () => {
    if (mediaQuery.matches) {
        left.style.transform = "translateX(0%)";
        left.style.width = "70vw";
    } else {
        left.style.transform = "translateX(0%)";
        right.style.position = "relative";
        right.style.width = "75vw";
        turn--;
    }
});