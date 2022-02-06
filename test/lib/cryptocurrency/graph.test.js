const graph = require('../../../lib/cryptocurrency/graph');
const assert = require('assert');

describe('DAG', function() {
    describe('graph', function() {
        const testGraph = graph.instance();
        testGraph.addVertex('abc', 'genesis');

        it('should return vertex in graph', function() {
            assert.equal(testGraph.graph['abc'].name, 'abc');
        });

        it('should throw error on nonexistant parent vertex', function() {
            assert.throws(() => testGraph.addVertex('def', 'fake'));
        });
    });
});