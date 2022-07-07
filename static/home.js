//Prevent arrows to scroll the page
window.addEventListener("keydown", function(e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { // space and arrow keys
        e.preventDefault();
    }
}, false);

//Detect Firefox browser
const dom_ready = () => {
    const is_firefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (is_firefox) {
        document.querySelector("#firefox-warning").style.display = "block";
    }
};
document.addEventListener('DOMContentLoaded', dom_ready, false);
