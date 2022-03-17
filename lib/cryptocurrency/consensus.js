const graph = require('./graph');
const _ = require('lodash');

class Consensus {
    /**
     * Initializes consensus model with multiple graphs
     *
     * @public
     * @param {Object} graphs an object of graphs keyed on node ID.
     */
    constructor(graphs) {
        this.graphs = graphs;
    }

    /**
     * Determines consensus between multiple graphs, and returns the winning version
     *
     * @public
     * @returns {Object} Returns the resolved graph.
     */
     resolveGraphs() {
        //All graphs are identical (rare, but worth checking)
        if(new Set(this.graphs.map(JSON.stringify)).size == 1) {
            return Object.values(this.graphs)[0];
        }
        
        //All graphs have the same number of items
        if(new Set(this.graphs.map(graph => Object.keys(graph).length)).size == 1) {
            //All graphs have identical txIds, possibly in different order
            if(new Set(this.graphs.map(graph => JSON.stringify(Object.keys(graph).sort()))).size == 1) {
                let counts = new Set();
                let discrepancies = {};
                //For each transaction id, all graphs have the same transaction 
                Object.keys(this.graphs[0]).sort().forEach(txId => {
                    let currTransactions = new Set();
                    let allCurrTransactions = [];
                    this.graphs.forEach(currGraph => {
                        currTransactions.add(currGraph[txId]);
                        allCurrTransactions.push(currGraph[txId]);
                    });
                    counts.add(currTransactions.size);
                    if(currTransactions.size > 1) {
                        discrepancies[txId] = allCurrTransactions;
                    }
                });
                if(counts.size == 1) {
                    return Object.values(this.graphs)[0];
                }
                let resolved = Object.values(this.graphs)[0];
                _.map(discrepancies, (transacations, txId) => {
                    let resolvedTransaction = _.head(_(transacations)
                        .map(JSON.stringify)
                        .countBy()
                        .entries()
                        .maxBy(_.last));
                    resolved[txId] = JSON.parse(resolvedTransaction);
                });
                return resolved;
            }
        }
    }
}

module.exports.instance = (graphs) => {
    return new Consensus(graphs);
};
module.exports.model = Consensus;