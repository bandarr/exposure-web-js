document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Parse frequencyValues into a series of objects
    const frequencyValues = [];
    Object.keys(data).forEach(key => {
      const match = key.match(/^frequency_(\d+)$/);
      if (match) {
        const index = match[1];
        frequencyValues.push({
          frequency: data[`frequency_${index}`],
          swr: data[`swr_${index}`],
          gaindbi: data[`gaindbi_${index}`]
        });
        delete data[`frequency_${index}`];
        delete data[`swr_${index}`];
        delete data[`gaindbi_${index}`];
      }
    });

    // Validate frequencyValues array
    const isValid = frequencyValues.length > 0 && frequencyValues.every(fv =>
      !isNaN(fv.frequency) && !isNaN(fv.swr) && !isNaN(fv.gaindbi)
    );

    if (!isValid) {
      alert("Please enter valid numeric values for frequency, SWR, and gain (dBi).");
      return;
    }

    data.frequencyValues = frequencyValues;

    fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => {
        return response.json();
      })
      .then(responseData => {
        const resultField = document.getElementById("result");
        if (responseData.error) {
          alert(responseData.error);
        } else {
          resultField.innerHTML = responseData.map(d => `Frequency: ${d.frequency}, Distance: ${d.distance}`).join('<br>');
        }
      })
      .catch(console.error);
  });

  document.getElementById("addFrequencyValuesButton").addEventListener("click", () => {
    const frequencyValues = document.getElementById("frequencyValues");
    const newDiv = document.createElement("div");
    const uniqueId = frequencyValues.children.length;
    newDiv.innerHTML = `<div class="form-group" id="freq-val-set_${uniqueId}">
        <label for="frequency_${uniqueId}">Frequency:</label>
        <input type="text" id="frequency_${uniqueId}" name="frequency_${uniqueId}">
        <label for="swr_${uniqueId}">SWR:</label>
        <input type="text" id="swr_${uniqueId}" name="swr_${uniqueId}">
        <label for="gaindbi_${uniqueId}">Gain (dBi):</label>
        <input type="text" id="gaindbi_${uniqueId}" name="gaindbi_${uniqueId}">
        <button type="button" id="removeFrequencyValueButton_${uniqueId}">Delete</button>
        </div>`;

    const button = newDiv.querySelector(`#removeFrequencyValueButton_${uniqueId}`);
    button.addEventListener("click", () => {
      const element = document.getElementById(`freq-val-set_${uniqueId}`);
      element.remove();
    });

    frequencyValues.appendChild(newDiv);
  });

});
