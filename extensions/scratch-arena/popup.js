const spritesDiv = document.getElementById("sprites");
const status = document.getElementById("status");

document.getElementById("refresh").onclick = loadData;

loadData();

function loadData(){

    chrome.tabs.query({active:true,currentWindow:true},tabs=>{

        chrome.tabs.sendMessage(
            tabs[0].id,
            {type:"GET_SCRATCH_INFO"},
            response=>{

                if(chrome.runtime.lastError){

                    status.textContent="找不到 Scratch 專案";
                    return;
                }

                if(!response){

                    status.textContent="沒有收到資料";
                    return;
                }

                status.textContent=
                    `共有 ${response.sprites.length} 個角色`;

                spritesDiv.innerHTML="";

                response.sprites.forEach(sprite=>{

                    const div=document.createElement("div");
                    div.className="sprite";

                    let html=`
                        <div class="sprite-title">${sprite.name}</div>
                        X：${sprite.x}<br>
                        Y：${sprite.y}<br>
                        Direction：${sprite.direction}<br>
                        Size：${sprite.size}<br>
                        <hr>
                    `;

                    sprite.variables.forEach(v=>{

                        html+=`
                        <div class="variable">
                        ${v.name} = ${JSON.stringify(v.value)}
                        </div>
                        `;

                    });

                    div.innerHTML=html;

                    spritesDiv.appendChild(div);

                });

            });

    });

}