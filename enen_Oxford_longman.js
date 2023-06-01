function findWord(word) {
  let oxfordUrl = "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(word);
  let longmanUrl = "https://www.ldoceonline.com/dictionary/" + encodeURIComponent(word);

  let oxfordPromise = fetch(oxfordUrl)
    .then(response => response.text())
    .then(html => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(html, "text/html");
      let definitions = doc.querySelectorAll('.entry');
      let results = [];
      for (let i = 0; i < definitions.length; i++) {
        let definition = definitions[i].textContent.trim();
        results.push(definition);
      }
      return results;
    });

  let longmanPromise = fetch(longmanUrl)
    .then(response => response.text())
    .then(html => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(html, "text/html");
      let definitions = doc.querySelectorAll('.Entry');
      let results = [];
      for (let i = 0; i < definitions.length; i++) {
        let definition = definitions[i].textContent.trim();
        results.push(definition);
      }
      return results;
    });

  return Promise.all([oxfordPromise, longmanPromise]);
}

function getDefinition(word) {
  return new Promise(function (resolve, reject) {
    findWord(word)
      .then(results => {
        let definitions = [].concat(...results);
        let definition = definitions.join('\n\n');
        resolve(definition);
      })
      .catch(error => {
        reject(error);
      });
  });
}

getDefinition(selectedText)
  .then(definition => {
    sendResponse(definition);
  })
  .catch(error => {
    console.error(error);
    sendResponse(null);
  });
