
let test = {
	start: { A: 5, B: 2 },
	A: { start: 1, C: 4, D: 2 },
	B: { A: 8, D: 7 },
	C: { D: 6, finish: 3 },
	D: { finish: 1 },
	finish: {},
};

let test2 = {
    "NodeA": {"name": "NodeA", "adjacentTo": ["NodeB", "NodeC"]},
    "NodeB": {"name": "NodeB", "adjacentTo": ["NodeC", "NodeD"]},
    "NodeC": {"name": "NodeC", "adjacentTo": ["NodeA"]},
    "NodeD": {"name": "NodeD", "adjacentTo": []}
}

class Graph {
    constructor() {
        this.graph = {
            genesis: {
                name: 'genesis',
                children: [],
            }
        };
    }

    addVertex(name, parent) {
        if(!this.graph[parent]) {
            throw 'Invalid parent vertex';
        }
        this.graph[parent].children.push(name);
        this.graph[name] = {name, children: []};
    }
}

module.exports.instance = () => {
    return new Graph();
};
module.exports.model = Graph;