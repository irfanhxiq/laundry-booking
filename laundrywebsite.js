document.addEventListener("DOMContentLoaded", function () {
    let queue = 1;
    let bookingWindow = null;

    const machines = {
        "Kolej Zamrud": { "washer1": [], "washer2": [], "dryer1": [], "dryer2": [] },
        "Kolej Baiduri 1": { "washer1": [], "washer2": [], "dryer1": [], "dryer2": [] },
        "Kolej Baiduri 2": { "washer1": [], "washer2": [], "dryer1": [], "dryer2": [] }
    };

    function updateMachineDropdown() {
        const service = document.getElementById("service").value;
        const college = document.getElementById("college").value;
        const washerDropdown = document.getElementById("washerDropdown");
        const dryerDropdown = document.getElementById("dryerDropdown");
        const washerSelect = document.getElementById("washer");
        const dryerSelect = document.getElementById("dryer");

        washerSelect.innerHTML = "";
        dryerSelect.innerHTML = "";
        washerSelect.removeAttribute('required');
        dryerSelect.removeAttribute('required');
        washerDropdown.classList.add("hidden");
        dryerDropdown.classList.add("hidden");

        if (service === "washer" || service === "both") {
            washerDropdown.classList.remove("hidden");
            washerSelect.appendChild(new Option("Washer 1", "washer1"));
            washerSelect.appendChild(new Option("Washer 2", "washer2"));
            washerSelect.setAttribute('required', 'true');
        }

        if (service === "dryer" || service === "both") {
            dryerDropdown.classList.remove("hidden");
            dryerSelect.appendChild(new Option("Dryer 1", "dryer1"));
            dryerSelect.appendChild(new Option("Dryer 2", "dryer2"));
            dryerSelect.setAttribute('required', 'true');
        }
    }

    // Helper: check if new booking overlaps with existing ones
    function isConflict(college, machine, newStart, newEnd) {
        return machines[college][machine].some(b => {
            return newStart < b.end && newEnd > b.start;
        });
    }

    // Helper: check if the selected booking time is within restricted hours (12 AM to 7 AM)
    function isRestrictedTime(startTime) {
        const restrictedStart = new Date("1970-01-01T00:00:00"); // 12 AM
        const restrictedEnd = new Date("1970-01-01T07:00:00"); // 7 AM
        // Check if startTime is between 12 AM and 7 AM
        return (startTime >= restrictedStart && startTime <= restrictedEnd);
    }

    document.getElementById("bookNowBtn").addEventListener("click", function() {
        document.getElementById("landingPage").style.display = "none";
        document.getElementById("bookingFormContainer").style.display = "block";
        updateMachineDropdown();
    });

    document.getElementById("bookingForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const college = document.getElementById("college").value;
        const time = document.getElementById("time").value;
        const service = document.getElementById("service").value;
        const washer = document.getElementById("washer").value;
        const dryer = document.getElementById("dryer").value;
        const additionalHours = parseInt(document.getElementById("additionalHours").value) || 0;

        if (!time || !name || (service === "both" && (!washer || !dryer)) || (service !== "both" && !washer && !dryer)) {
            alert("Please fill out all fields.");
            return;
        }

        let baseCost = 0;
        if (service === "washer") baseCost = 4;
        else if (service === "dryer") baseCost = 5;
        else if (service === "both") baseCost = 9;

        const additionalCost = additionalHours * 1;
        const totalCost = baseCost + additionalCost;

        let duration = (service === "both") ? 2 : 1;
        const startTime = new Date(`1970-01-01T${time}:00`);
        const endTime = new Date(startTime.getTime() + (duration + additionalHours) * 60 * 60 * 1000);

        // Check if the booking time falls within the restricted hours (12 AM to 7 AM)
        if (isRestrictedTime(startTime)) {
            alert("Bookings cannot be made from 12:00 AM to 7:00 AM. Please choose a different time.");
            return;
        }

        document.getElementById("confirmTime").textContent = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById("confirmService").textContent = service.charAt(0).toUpperCase() + service.slice(1);
        document.getElementById("confirmMachine").textContent = service === "both" ? `${washer}, ${dryer}` : (service === "washer" ? washer : dryer);
        document.getElementById("confirmCost").textContent = totalCost;

        const popup = document.getElementById("confirmationPopup");
        popup.classList.remove("hidden");
        popup.style.opacity = "1";
        popup.style.visibility = "visible";

        document.getElementById("confirmBtn").onclick = function() {
            // --- Check for conflicts across time ranges ---
            let conflict = false;
            if (service === "washer" || service === "both") {
                if (isConflict(college, washer, startTime, endTime)) conflict = true;
            }
            if (service === "dryer" || service === "both") {
                if (isConflict(college, dryer, startTime, endTime)) conflict = true;
            }

            if (conflict) {
                const errorMsg = document.getElementById("errorMessage");
                errorMsg.textContent = "The selected time overlaps with an existing booking. Please choose a different slot.";
                errorMsg.style.display = "block";
                return; // stop booking
            }

            // Record booking ranges
            if (service === "washer" || service === "both") {
                machines[college][washer].push({ start: startTime, end: endTime });
            }
            if (service === "dryer" || service === "both") {
                machines[college][dryer].push({ start: startTime, end: endTime });
            }

            // Hide error if previously shown
            document.getElementById("errorMessage").style.display = "none";

            // --- Keep one window open ---
            if (!bookingWindow || bookingWindow.closed) {
                bookingWindow = window.open("", "_blank", "width=600,height=400");
                bookingWindow.document.write("<h2>Booking Timetable</h2>");
                bookingWindow.document.write("<table border='1' id='timetable'><thead><tr><th>Queue Number</th><th>Student Name</th><th>College</th><th>Booking Time</th><th>End Time</th><th>Service</th><th>Machine</th><th>Total Cost</th></tr></thead><tbody></tbody></table>");
                bookingWindow.document.close();
            }

            // Append new row into existing table
            const timetableBody = bookingWindow.document.querySelector("#timetable tbody");
            const row = bookingWindow.document.createElement("tr");
            row.innerHTML = `
                <td>${queue}</td>
                <td>${name}</td>
                <td>${college}</td>
                <td>${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${service.charAt(0).toUpperCase() + service.slice(1)}</td>
                <td>${service === "both" ? `${washer}, ${dryer}` : (service === "washer" ? washer : dryer)}</td>
                <td>RM ${totalCost}</td>
            `;
            timetableBody.appendChild(row);

            // Fade out popup
            popup.style.transition = "opacity 0.5s ease";
            popup.style.opacity = "0";
            setTimeout(() => {
                popup.style.visibility = "hidden";
                popup.classList.add("hidden");
            }, 500);

            // Reset form
            document.getElementById("bookingForm").reset();
            queue++;
        };

        document.getElementById("cancelBtn").onclick = function() {
            popup.style.transition = "opacity 0.5s ease";
            popup.style.opacity = "0";
            setTimeout(() => {
                popup.style.visibility = "hidden";
                popup.classList.add("hidden");
            }, 500);
        };
    });

    document.getElementById("service")?.addEventListener("change", updateMachineDropdown);
});
