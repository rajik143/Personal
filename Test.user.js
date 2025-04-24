// ==UserScript==
// @name         ✅Sbo Redirect Go To Task Page
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add working redirect button without downloading
// @author       ChatGPT
// @match        https://sboportal.org.in/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addRedirectButton() {
        const downloadBtn = document.querySelector('a[href*="microfoure.jpeg"]');
        if (downloadBtn && !document.querySelector('#redirect-task-btn')) {
            const redirectBtn = document.createElement('a');
            redirectBtn.href = 'https://sboportal.org.in/articledetail/2';
            redirectBtn.textContent = 'Go to Task Page';
            redirectBtn.id = 'redirect-task-btn';

            // Copy styles from the original button
            redirectBtn.className = downloadBtn.className;
            redirectBtn.style.marginLeft = '10px';
            redirectBtn.target = '_blank'; // open in new tab

            downloadBtn.parentNode.insertBefore(redirectBtn, downloadBtn.nextSibling);
        }
    }

    setTimeout(addRedirectButton, 150);
})();
