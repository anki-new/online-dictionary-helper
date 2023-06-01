/* global api, hash */

class encn_Oxford {
  constructor(options) {
    this.token = '';
    this.gtk = '';
    this.options = options;
    this.maxexample = 2;
    this.word = '';
  }

  async displayName() {
    return 'Oxford EN->EN Dictionary';
  }

  setOptions(options) {
    this.options = options;
    this.maxexample = options.maxexample;
  }

  async getToken() {
    let homeurl = 'https://fanyi.baidu.com/';
    let homepage = await api.fetch(homeurl);
    let tmatch = /token: '(.+?)'/gi.exec(homepage);
    if (!tmatch || tmatch.length < 2) return null;
    let gmatch = /window.gtk = '(.+?)'/gi.exec(homepage);
    if (!gmatch || gmatch.length < 2) return null;
    return {
      'token': tmatch[1],
      'gtk': gmatch[1]
    };
  }

  async findTerm(word) {
    this.word = word;
    let deflection = await api.deinflect(word) || [];
    let promises = [word, deflection].map(x => this.findOxford(x));
    let results = await Promise.all(promises);
    return [].concat(...results).filter(x => x);
  }

  async findOxford(word) {
    const maxexample = this.maxexample;
    let notes = [];
    if (!word) return notes;
    let base = 'https://fanyi.baidu.com/v2transapi?from=en&to=zh&simple_means_flag=3';

    if (!this.token || !this.gtk) {
      let common = await this.getToken();
      if (!common) return [];
      this.token = common.token;
      this.gtk = common.gtk;
    }

    let sign = hash(word, this.gtk);
    if (!sign) return;

    let dicturl = base + `&query=${word}&sign=${sign}&token=${this.token}`;
    let data = '';
    try {
      data = JSON.parse(await api.fetch(dicturl));
      let oxford = getOxford(data);
      let bdsimple = oxford.length ? [] : getBDSimple(data); //Combine Youdao Concise English-Chinese Dictionary to the end.
      let bstrans = oxford.length || bdsimple.length ? [] : getBDTrans(data); //Combine Youdao Translation (if any) to the end.
      return [].concat(oxford, bdsimple, bstrans);
    } catch (err) {
      return [];
    }

    function getBDTrans(data) {
      try {
        if (data.dict_result && data.dict_result.length != 0) return [];
        if (!data.trans_result || data.trans_result.data.length < 1) return [];
        let css = '<style>.odh-expression {font-size: 1em!important;font-weight: normal!important;}</style>';
        let expression = data.trans_result.data[0].src;
        let definition = data.trans_result.data[0].dst;
        return [{
          css,
          expression,
          definitions: [definition]
        }];
      } catch (error) {
        return [];
      }
    }

    function getBDSimple(data) {
      try {
        let simple = data.dict_result.simple_means;
        if (!simple || simple.symbols.length < 1) return [];
        let css = '<style>.odh-separator {display: none!important;}</style>';
        let expression = simple.word_name;
        let symbols = simple.symbols;
        let definitions = [];
        for (let symbol of symbols) {
          let parts = symbol.parts || [];
          for (let part of parts) {
            let defs = part.means || [];
            for (let def of defs) {
              definitions.push(def);
            }
          }
        }
        return [{
          css,
          expression,
          definitions
        }];
      } catch (error) {
        return [];
      }
    }

    function getOxford(data) {
      try {
        let oxford = data.dict_result.oxford;
        if (!oxford || oxford.length < 1) return [];
        let css = '<style>.odh-separator {display: none!important;}</style>';
        let expression = oxford.word_name;
        let entries = oxford.entries;
        let list = [];
        for (let entry of entries) {
          let category = '';
          let definitions = [];
          if (entry.category) {
            category = `<span class='category'>${entry.category}</span>`;
          }
          if (entry.senses && entry.senses.length > 0) {
            for (let sense of entry.senses) {
              let pos = '';
              if (sense.pos) {
                pos = `<span class='pos'>${sense.pos}</span>`;
              }
              let definition = pos + `<span class='tran'><span class='eng_tran'>${sense.definition}</span></span>`;
              definitions.push(definition);
              if (sense.examples && sense.examples.length > 0) {
                let examples = sense.examples.slice(0, maxexample).map(ex => `<li class='sent'><span class='eng_sent'>${ex}</span></li>`).join('');
                definitions.push(`<ul class="sents">${examples}</ul>`);
              }
              if (sense.synonyms && sense.synonyms.length > 0) {
                let synonyms = sense.synonyms.slice(0, maxexample).join(', ');
                definitions.push(`<div class="synonyms">Synonyms: ${synonyms}</div>`);
              }
            }
          }
          if (category || definitions.length > 0) {
            let css = '';
            if (list.length > 0) {
              css = '<style>.odh-separator {display: block!important;}</style>';
            }
            list.push({
              css,
              expression,
              definitions: [category, ...definitions]
            });
          }
        }
        return list;
      } catch (error) {
        return [];
      }
    }
  }
}

function hash(e, t) {
  if (null === e || void 0 === e || !e.length) return null;
  let i = 0;
  for (let n = 0; n < e.length; n++) {
    let r = e.charCodeAt(n);
    i = (i << 5) - i + r;
    i &= i;
  }
  return i.toString(16);
}

const encn = new encn_Oxford();
encn.displayName().then(console.log);

encn.findTerm('example').then(console.log);
