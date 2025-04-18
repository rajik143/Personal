// ==UserScript==
// @name         ✅ SBO Task Monitor Stylish Box Toggle v6.2
// @namespace    http://tamilscript.local/
// @version      6.2
// @description  Toggle box with 12-hour time format (AM/PM), shows weekday, loads data on page load
// @match        https://sboportal.org.in/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const TELEGRAM_TOKEN = '8075545532:AAGrmNcqDfZaoNykcRuKZjMouXw9A1k9rcY'; // replace with your token
    const TELEGRAM_CHAT_ID = '-4731191418'; // replace with your chat id

    function sendTelegramMessage(message) {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        });
    }

    function getLiveUserDetails() {
        return fetch('/dashboard')
            .then(res => res.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const name = doc.querySelector('h2')?.innerText.trim() || 'Unknown';
                const staffId = doc.querySelector('h6')?.innerText.trim() || 'Unknown';

                const h4s = doc.querySelectorAll('h4');
                let taskValue = 'N/A';
                let taskNumber = null;
                h4s.forEach(h4 => {
                    if (h4.textContent.trim() === 'Task Wallet') {
                        const h3 = h4.parentElement.querySelector('h3');
                        if (h3) {
                            taskValue = h3.textContent.trim();
                            const cleaned = taskValue.replace(/[^0-9.]/g, '');
                            taskNumber = parseFloat(cleaned);
                        }
                    }
                });

                return {
                    name,
                    staffId,
                    taskAmount: taskNumber !== null ? `₹${taskNumber.toFixed(2)}` : taskValue,
                    minus20: taskNumber !== null ? `₹${(taskNumber * 0.8).toFixed(2)}` : 'N/A'
                };
            })
            .catch(() => ({
                name: 'Unknown',
                staffId: 'Unknown',
                taskAmount: 'N/A',
                minus20: 'N/A'
            }));
    }

    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.bottom = '520px';
    box.style.right = '10px';
    box.style.minWidth = '180px';
    box.style.maxWidth = '250px';
    box.style.maxHeight = '30px';
    box.style.overflow = 'hidden';
    box.style.background = 'rgba(255,255,255,0.25)';
    box.style.backdropFilter = 'blur(10px)';
    box.style.borderRadius = '10px';
    box.style.padding = '8px 12px';
    box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    box.style.color = '#000';
    box.style.fontWeight = 'bold';
    box.style.fontSize = '13px';
    box.style.cursor = 'pointer';
    box.style.transition = 'max-height 0.4s ease, padding 0.3s ease';
    box.style.zIndex = '9999';
    box.innerHTML = 'Show Info';
    document.body.appendChild(box);

    let expanded = false;
    let isLoading = false;
    let storedContent = ''; // Store the fetched content

    function toggleBox(contentHTML = '') {
        if (!expanded) {
            box.innerHTML = contentHTML || storedContent; // Use provided content or stored content
            box.style.padding = '12px 15px';
            box.style.maxHeight = '500px';
            expanded = true;
        } else {
            box.innerHTML = 'Show Info';
            box.style.maxHeight = '30px';
            box.style.padding = '8px 12px';
            expanded = false;
        }
    }

    function loadData() {
        if (isLoading) return;
        isLoading = true;

        box.innerHTML = '<div style="padding:12px 0;">Loading...</div>';
        box.style.maxHeight = '500px';
        box.style.padding = '12px 15px';

        getLiveUserDetails().then(({ name, staffId, taskAmount, minus20 }) => {
            fetch('/workingnonworkinghistorypage')
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const rows = doc.querySelectorAll('table tbody tr');

                    if (rows.length > 0) {
                        const firstRow = rows[0];
                        const cells = firstRow.querySelectorAll('td');
                        if (cells.length >= 6) {
                            const amount = cells[2].innerText.trim();
                            const rawDate = cells[4].innerText.trim();
                            const dateObj = new Date(rawDate.replace(/-/g, ' '));
                            const istOffset = 5.5 * 60 * 60 * 1000;
                            const istDate = new Date(dateObj.getTime() + istOffset);

                            const weekday = istDate.toLocaleDateString('en-IN', { weekday: 'short' }); // Sun, Mon, etc.
                            const datePart = istDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit'
                            });
                            const timePart = istDate.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                            });

                            const currentValue = `${amount}|${datePart} ${timePart}`;
                            const previousValue = localStorage.getItem('sbo_last_credit');

                            if (previousValue !== currentValue) {
                                localStorage.setItem('sbo_last_credit', currentValue);
                                const alertMessage = `✅ Task Completed\nName: ${name}\nStaff ID: ${staffId}\nAmount: ₹${amount}\nTime: ${weekday}, ${datePart} ${timePart}\n#Task`;
                                sendTelegramMessage(alertMessage);
                            }

                            const contentHTML = `
                                <div><b>Task Wallet:</b> ${taskAmount}</div>
                                <div><b>-20%:</b> ${minus20}</div>
                                <div style="margin-top:4px;"><b>Last Task:</b> ₹${amount}</div>
                                <div>${datePart}</div>
                                <div><b>${weekday}</b>, <b>${timePart}</b></div>
                            `;
                            storedContent = contentHTML;
                            toggleBox(contentHTML);
                        } else {
                            storedContent = '<b>Task info error</b>';
                            toggleBox(storedContent);
                        }
                    } else {
                        storedContent = '<b>No task data</b>';
                        toggleBox(storedContent);
                    }
                })
                .catch(() => {
                    storedContent = '<b>Error fetching task info</b>';
                    toggleBox(storedContent);
                })
                .finally(() => {
                    isLoading = false;
                });
        });
    }

    // Load data immediately after page load
    loadData();

    // Toggle box on click
    box.addEventListener('click', () => {
        if (isLoading) return;
        if (!expanded && !storedContent) {
            loadData();
        } else {
            toggleBox();
        }
    });

    // Reset page load tracking
    function resetPageLoad() {
        localStorage.removeItem('page_loaded');
    }
    window.addEventListener('beforeunload', resetPageLoad);
})();