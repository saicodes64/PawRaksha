// Vaccination data repository
const vaccinationData = {
    "dogs": {
      "core_vaccines": [
        {
          "name": "Rabies",
          "initial_schedule": [
            { "age_weeks": 12, "dose": "first" },
            { "age_weeks": 52, "dose": "booster" }
          ],
          "follow_up": "annually or every 3 years depending on vaccine type",
          "interval_weeks": 52
        },
        {
          "name": "DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)",
          "initial_schedule": [
            { "age_weeks": 6, "dose": "first" },
            { "age_weeks": 10, "dose": "second" },
            { "age_weeks": 14, "dose": "third" },
            { "age_weeks": 18, "dose": "final" }
          ],
          "follow_up": "annually or every 3 years depending on antibody titers",
          "interval_weeks": 156
        },
        {
          "name": "Leptospirosis",
          "initial_schedule": [
            { "age_weeks": 12, "dose": "first" },
            { "age_weeks": 16, "dose": "booster" }
          ],
          "follow_up": "annually",
          "interval_weeks": 52
        }
      ],
      "non_core_vaccines": [
        {
          "name": "Bordetella",
          "recommended_for": ["dogs in kennels", "frequent boarding", "dog parks"],
          "initial_schedule": [{ "age_weeks": 8, "dose": "initial" }],
          "follow_up": "every 6 months",
          "interval_weeks": 26
        },
        {
          "name": "Lyme Disease",
          "recommended_for": ["dogs in tick-endemic areas"],
          "initial_schedule": [
            { "age_weeks": 12, "dose": "first" },
            { "age_weeks": 16, "dose": "booster" }
          ],
          "follow_up": "annually before tick season",
          "interval_weeks": 52
        }
      ],
      "breed_specific": {
        "small_breeds": {
          "special_considerations": "May need adjusted dosages",
          "recommended_vaccines": ["Rabies", "DHPP", "Leptospirosis"]
        },
        "medium_breeds": {
          "special_considerations": "Standard protocol applies",
          "recommended_vaccines": ["Rabies", "DHPP", "Leptospirosis", "Bordetella"]
        },
        "large_breeds": {
          "special_considerations": "May need additional booster for rapid growth",
          "recommended_vaccines": ["Rabies", "DHPP", "Leptospirosis", "Bordetella"]
        }
      }
    },
    "cats": {
      "core_vaccines": [
        {
          "name": "Rabies",
          "initial_schedule": [
            { "age_weeks": 12, "dose": "first" },
            { "age_weeks": 52, "dose": "booster" }
          ],
          "follow_up": "annually or every 3 years depending on vaccine type",
          "interval_weeks": 52
        },
        {
          "name": "FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)",
          "initial_schedule": [
            { "age_weeks": 6, "dose": "first" },
            { "age_weeks": 10, "dose": "second" },
            { "age_weeks": 14, "dose": "third" }
          ],
          "follow_up": "every 1-3 years depending on risk",
          "interval_weeks": 52
        }
      ],
      "non_core_vaccines": [
        {
          "name": "FeLV (Feline Leukemia Virus)",
          "recommended_for": ["outdoor cats", "cats in multi-cat households"],
          "initial_schedule": [
            { "age_weeks": 8, "dose": "first" },
            { "age_weeks": 12, "dose": "booster" }
          ],
          "follow_up": "annually for at-risk cats",
          "interval_weeks": 52
        }
      ],
      "breed_specific": {
        "all_breeds": {
          "special_considerations": "Vaccine protocols are generally similar across cat breeds",
          "recommended_vaccines": ["Rabies", "FVRCP"]
        }
      }
    }
  };
  
  // Utility functions for date calculations
  function getCurrentDate() {
    const today = new Date();
    return today;
  }
  
  function addWeeksToDate(date, weeks) {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  }
  
  function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  function calculateAgeInWeeks(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    const diffTime = today - birth;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 7);
  }
  
  // Core vaccination schedule logic
  function getVaccinationSchedule(petType, birthdate, breedSize, lastVaccinations = {}) {
    // Convert birthdate to age in weeks
    const ageInWeeks = calculateAgeInWeeks(birthdate);
    
    // Get pet type data
    const petData = vaccinationData[petType.toLowerCase()];
    if (!petData) return { error: "Pet type not found in our database" };
    
    const recommendations = [];
    const today = getCurrentDate();
    
    // Process core vaccines
    petData.core_vaccines.forEach(vaccine => {
      const vaccineName = vaccine.name;
      const lastVaccinationDate = lastVaccinations[vaccineName] || null;
      
      if (!lastVaccinationDate) {
        // Initial vaccination schedule
        for (let schedule of vaccine.initial_schedule) {
          if (ageInWeeks >= schedule.age_weeks) {
            recommendations.push({
              name: vaccineName,
              due_date: today,
              dose: schedule.dose,
              status: "overdue",
              type: "core"
            });
            return; // Only add the first needed dose
          } else {
            const dueDate = addWeeksToDate(birthdate, schedule.age_weeks);
            recommendations.push({
              name: vaccineName,
              due_date: dueDate,
              dose: schedule.dose,
              status: "upcoming",
              type: "core"
            });
            return; // Only add the first needed dose
          }
        }
      } else {
        // Follow-up vaccination schedule
        const lastDate = new Date(lastVaccinationDate);
        const nextDueDate = addWeeksToDate(lastDate, vaccine.interval_weeks);
        
        const status = nextDueDate <= today ? "overdue" : "upcoming";
        recommendations.push({
          name: vaccineName,
          due_date: nextDueDate,
          dose: "booster",
          status: status,
          type: "core"
        });
      }
    });
    
    // Process non-core vaccines based on breed size or other factors
    let breedKey = "all_breeds"; // Default
    
    if (petType.toLowerCase() === "dogs") {
      if (breedSize === "small") breedKey = "small_breeds";
      else if (breedSize === "medium") breedKey = "medium_breeds";
      else if (breedSize === "large") breedKey = "large_breeds";
    }
    
    const breedInfo = petData.breed_specific[breedKey];
    if (breedInfo) {
      // Add recommended non-core vaccines for this breed
      petData.non_core_vaccines.forEach(vaccine => {
        if (breedInfo.recommended_vaccines.includes(vaccine.name)) {
          const vaccineName = vaccine.name;
          const lastVaccinationDate = lastVaccinations[vaccineName] || null;
          
          if (!lastVaccinationDate) {
            // Initial non-core vaccination
            for (let schedule of vaccine.initial_schedule) {
              if (ageInWeeks >= schedule.age_weeks) {
                recommendations.push({
                  name: vaccineName,
                  due_date: today,
                  dose: schedule.dose,
                  status: "overdue",
                  type: "non-core",
                  reason: "Recommended for your pet's breed/size"
                });
                break;
              } else {
                const dueDate = addWeeksToDate(birthdate, schedule.age_weeks);
                recommendations.push({
                  name: vaccineName,
                  due_date: dueDate,
                  dose: schedule.dose,
                  status: "upcoming",
                  type: "non-core",
                  reason: "Recommended for your pet's breed/size"
                });
                break;
              }
            }
          } else {
            // Follow-up non-core vaccination
            const lastDate = new Date(lastVaccinationDate);
            const nextDueDate = addWeeksToDate(lastDate, vaccine.interval_weeks);
            
            const status = nextDueDate <= today ? "overdue" : "upcoming";
            recommendations.push({
              name: vaccineName,
              due_date: nextDueDate,
              dose: "booster",
              status: status,
              type: "non-core",
              reason: "Recommended for your pet's breed/size"
            });
          }
        }
      });
    }
    
    // Sort recommendations by due date
    recommendations.sort((a, b) => a.due_date - b.due_date);
    
    return {
      pet_age_weeks: ageInWeeks,
      vaccination_schedule: recommendations,
      special_considerations: breedInfo ? breedInfo.special_considerations : null
    };
  }
  
  // Function to display vaccination results in the UI
  function displayVaccinationResults(results) {
    const resultDiv = document.getElementById('vaccination-results');
    
    if (results.error) {
      resultDiv.innerHTML = `<div class="error-message">${results.error}</div>`;
      return;
    }
    
    let html = `
      <div class="vaccination-summary">
        <h3>Vaccination Schedule</h3>
        <p>Pet Age: ${Math.floor(results.pet_age_weeks / 52)} years, ${results.pet_age_weeks % 52} weeks</p>
      `;
      
    if (results.special_considerations) {
      html += `<p class="special-note"><strong>Special Note:</strong> ${results.special_considerations}</p>`;
    }
    
    html += `</div><div class="vaccination-table">`;
    
    // Create table for recommendations
    if (results.vaccination_schedule.length > 0) {
      html += `
        <table>
          <thead>
            <tr>
              <th>Vaccine</th>
              <th>Due Date</th>
              <th>Dose</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      results.vaccination_schedule.forEach(vaccine => {
        const statusClass = vaccine.status === "overdue" ? "overdue" : "upcoming";
        html += `
          <tr class="${statusClass}">
            <td>${vaccine.name}</td>
            <td>${formatDate(vaccine.due_date)}</td>
            <td>${vaccine.dose}</td>
            <td>${vaccine.type}</td>
            <td class="${statusClass}">${vaccine.status}</td>
          </tr>
        `;
      });
      
      html += `</tbody></table>`;
    } else {
      html += `<p>No vaccinations are currently due.</p>`;
    }
    
    html += `</div>`;
    html += `
    <div style="text-align: center; margin-top: 20px;">
      <button id="go-to-bill" class="redirect-button">Generate Bill</button>
    </div>
  `;
  
  resultDiv.innerHTML = html;
  
  // Optional: Attach event listener after rendering
  document.getElementById("go-to-bill").addEventListener("click", () => {
    window.location.href = "bill.html";
  });

}
  
  // To be called when form submits
  function processVaccinationForm(event) {
    if (event) event.preventDefault();
    
    const petType = document.getElementById('pet-type').value;
    const petBirthdate = document.getElementById('pet-birthdate').value;
    const breedSize = document.getElementById('breed-size').value;
    
    // Get last vaccination dates if available
    const lastVaccinations = {};
    
    const rabiesLastVax = document.getElementById('rabies-last-date').value;
    if (rabiesLastVax) {
      lastVaccinations["Rabies"] = rabiesLastVax;
    }
    
    const dhppLastVax = document.getElementById('dhpp-last-date').value;
    if (dhppLastVax && petType.toLowerCase() === 'dogs') {
      lastVaccinations["DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)"] = dhppLastVax;
    }
    
    const fvrcpLastVax = document.getElementById('fvrcp-last-date').value;
    if (fvrcpLastVax && petType.toLowerCase() === 'cats') {
      lastVaccinations["FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)"] = fvrcpLastVax;
    }
    
    // Calculate vaccination schedule
    const results = getVaccinationSchedule(petType, petBirthdate, breedSize, lastVaccinations);
    
    // Display results
    displayVaccinationResults(results);
    
    // Show the results container
    document.getElementById('vaccination-container').classList.add('show-results');
    
    return false;
  }
  
  // Initialize event listeners when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('vaccination-form');
    if (form) {
      form.addEventListener('submit', processVaccinationForm);
    }
    
    // Toggle additional fields based on pet type
    const petTypeSelect = document.getElementById('pet-type');
    if (petTypeSelect) {
      petTypeSelect.addEventListener('change', function() {
        const petType = this.value.toLowerCase();
        const dogFields = document.getElementById('dog-specific-fields');
        const catFields = document.getElementById('cat-specific-fields');
        
        if (petType === 'dogs') {
          if (dogFields) dogFields.style.display = 'block';
          if (catFields) catFields.style.display = 'none';
        } else if (petType === 'cats') {
          if (dogFields) dogFields.style.display = 'none';
          if (catFields) catFields.style.display = 'block';
        }
      });
    }
    
    // Reset button functionality
    const resetBtn = document.getElementById('reset-form');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        document.getElementById('vaccination-form').reset();
        document.getElementById('vaccination-results').innerHTML = '';
        document.getElementById('vaccination-container').classList.remove('show-results');
      });
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    const billButton = document.getElementById("go-to-bill");
    if (billButton) {
      billButton.addEventListener("click", function () {
        window.location.href = "bill.html";
      });
    }
  });
  