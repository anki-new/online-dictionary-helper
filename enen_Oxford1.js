class encn_Oxford {
    constructor(options) {
        // ...
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    // ...

    async findOxford(word) {
        // ...

        let oxford = getOxford(data); 
        let bdsimple = oxford.length ? [] : getBDSimple(data); 
        let bstrans = oxford.length || bdsimple.length ? [] : getBDTrans(data); 

        return [].concat(oxford, bdsimple, bstrans);

        // ...
    }

    // ...

    function getOxford(data) {
        // ...

        let entries = data.dict_result.oxford.entry[0].data;
        if (!entries) return [];

        let definitions = [];
        for (const entry of entries) {
            // ...

            if (group.tag == 'n-g') {
                definition += buildDefinitionBlock(expression, pos, group.data);
                definitions.push(definition);
            }

            // ...

            if (group.tag == 'sd-g' || group.tag == 'ids-g' || group.tag == 'pvs-g') {
                for (const item of group.data) {
                    // ...

                    let defs = [];
                    if (item.tag == 'n-g' || item.tag == 'id-g' || item.tag == 'pv-g') defs = item.data;
                    if (item.tag == 'vrs' || item.tag == 'xrs') defs = item.data[0].data;
                    definition += buildDefinitionBlock(expression, pos, defs);

                    // ...
                }
                definitions.push(definition);
            }
        }
        let css = encn_Oxford.renderCSS();
        notes.push({ css, expression, reading, definitions, audios });
        return notes;
    }

    // ...
}
