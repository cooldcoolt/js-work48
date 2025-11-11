import { postMessage12 } from "./api.js";
export const builUserInfo = async (baseUrl, method) => {
    try {
        let profileOb = await postMessage12(baseUrl, method, null);
        localStorage.setItem("profile", JSON.stringify(profileOb));
        let userinfo = document.createElement("div");
        userinfo.classList.add("userinfo");
        userinfo.setAttribute("email", profileOb.email);
        let ava = document.createElement("strong");
        ava.classList.add("ava");
        let leter = profileOb.firstName[0].toUpperCase();
        ava.textContent = leter;
        ava.style.backgroundColor = getColorFromName(leter);
        userinfo.appendChild(ava);
        let userName1 = document.createElement("span");
        userName1.classList.add("userName");
        userName1.textContent = profileOb.firstName + " " + profileOb.lastName;
        userinfo.appendChild(userName1);
        let btn = document.createElement("button");
        btn.classList.add("profBtn");
        userinfo.appendChild(btn);
        let chatName = document.createElement("h3");
        chatName.classList.add("chatName");
        chatName.textContent = "Atrractor chat";
        userinfo.appendChild(chatName);
        let isExist = mainsec.querySelector(".userinfo");
        if (isExist) {
            isExist.replaceWith(userinfo);
        }
        else {
            mainsec.appendChild(userinfo);
        }
        container.appendChild(mainsec);
        root.appendChild(container);
        btn.addEventListener("click", (event) => {
            event.preventDefault();
            if (btn) {
                controlUser();
            }
        });
    }
    catch (error) {
        console.log("builUserInfo throws: " + error);
        throw error;
    }
};
