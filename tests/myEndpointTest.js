'use strict';
const chai = require('chai');
const expect = chai.expect;
const supertest = require('supertest-as-promised');
const pokemonAPIServer = require('../server/FakeAPI.js');

chai.should();
chai.use(require('chai-things'));

describe('All feactures', () => {
  var request;
  var pokemons = [];

  before(() => {
    pokemonAPIServer.start(3000);

    request = supertest('http://localhost:3000/v1/pokemons')
    return request.post('/')
      .send({name: 'charmander', type: 'FIRE', level: 1})
      .expect(200)
      .then((res) => {
        return request.post('/')
          .send({name: 'Bulbasor', type: 'WATER', level: 2})
          .then(() => {
            return request.get('/')
              .then((res) => {
                pokemons = res.body;
              });
          });
      });
  });

  after(() => {
    pokemonAPIServer.stop();
  });


  describe('Feature: Existent pokemons should be retrieved with all the mandatory information', () => {
    context('When the GET pokemons endpoint is invoked', () => {
      it('Then it should get all the expected pokemons', () => {
        expect(pokemons).to.not.be.undefined;
        pokemons.should.all.have.property('id');
        pokemons.should.all.have.property('name');
        pokemons.should.all.have.property('level');
        pokemons.should.all.have.property('type');
      });
    });
  });

  /** Discovery testing **/

  /** The API does not retrieve any message that can be useful to find out why the 
    the request is BAD **/
  describe('Feature: The pokemons\' level should be greater or equal than 0', () => {
    context('When the user is going to add a pokemon that does not have the level required', () => {
      it('The level value could be greater than 0', () => {
        var countPokemons = pokemons.filter((pokemon) => {
          return pokemon.level >= 0;
        });
        expect(pokemons.length).to.equal(countPokemons.length)
      })
      it('Then it should be get back the error message: \'Bad Request\'', (done) => {
        return request.post('/')
          .send({name: 'picachu', type: 'ELECTRIC', level: -1})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      })
    });
  });

  /** How much useful is this test? **/
  describe('Feature: The pokemon should be three required properties: name, type and level', () => {
    context('When the user create a new pokemon with the required properties', () => {
      it('Then it should be get back the pokemon with its ID', (done) => {
        return request.post('/')
          .send({name: 'charizar', type: 'FIRE', level: 100})
          .expect(200)
          .then((res) => {
            expect( res.body ).to.have.any.keys('id', 'type', 'level', 'name')
            done();
          });
      })
    });
    context('name, type and level are required properties', () => {
      it('the name parameter is required', (done) => {
        return request.post('/')
          .send({type: 'GRASS', level: 100})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      })
      it('the type parameter is required', (done) => {
        return request.post('/')
          .send({name: 'picachu', level: 100})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      })
      it('the level parameter is required', (done) => {
        return request.post('/')
          .send({name: 'picachu', type: 'DRAGON'})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      })
    }); 
  });

  describe('Feature: The right types of pokemons', () => {
    context('The type of any pokemon should be one of the required', () => {
      it('Valid types', () => {
        pokemons.forEach((pokemon) => {
          expect(pokemon.type).to.be.oneOf(['NORMAL', 'FIRE', 'FIGHTING',
            'WATER', 'FLYING', 'GRASS', 'POISON', 'ELECTRIC', 'GROUND', 'PSYCHIC',
            'ROCK', 'ICE', 'BUG', 'DRAGO', 'GHOST', 'DARK', 'STEEL', 'FAIRY'])
        })
      })
      it('DRAGON is an invalid type of pokemon', (done) => {
        return request.post('/')
          .send({name: 'picachu', type: 'DRAGON', level: 100})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      })
    });
  });

  describe('Feature: The right type of parameters', () => {
    context('Each parameter has its correct type', () => {
      it('id and name are of string type', () => {
        pokemons.forEach((pokemon) => {
          expect(pokemon.id).to.be.a('string');
          expect(pokemon.name).to.be.a('string');
          //expect(pokemon.level).to.be.a('integer');
        });
      })
      it('level is an integer', (done) => {
        return request.post('/')
          .send({name: 'picachu', type: 'ELECTRIK', level: '100'})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      })
    });
  });

  describe('Feature: Get the pokemon throught its Id', () => {
    context('When you try to add a add the wrong type of the parameters', () => {
      it('The pokemon with id should be', (done) => {
        return request.get('/'+pokemons[0].id)
          .expect(200)
          .then((res) => {
            expect( res.body.name ).to.equal(pokemons[0].name)
            done();
          });
      });
      it('The pokemon with id should be', (done) => {
        return request.get('/'+pokemons[pokemons.length-1].id)
          .expect(200)
          .then((res) => {
            expect( res.body.name ).to.equal(pokemons[pokemons.length-1].name)
            done();
          });
      });
      it('A pokemon that doesn\'t exist', (done) => {
        return request.get('/qwryaslx-zshas')
          .expect(404)
          .then((res) => {
            expect(res.body.name).to.equal(undefined)
            done();
          });
      });
    });
  });

  describe('Feature: Update a pokemon throught its Id', () => {
    context('Update a pokemon if the pokemon exists', () => {
      it('..', (done) => {
        return request.put('/'+pokemons[0].id)
          .send({name: 'charmilion', type: 'FIRE', level: 17})
          .expect(200)
          .then((res) => {
            expect(res.body).to.deep.equal({name: 'charmilion', type: 'FIRE', level: 17});
            done();
          });
      });
      it('if the pokemon does not exists', (done) => {
        return request.put('/qwryaslx-zshas')
          .send({name: 'Ivysaur', type: 'GRASS', level: 17})
          .expect(404)
          .then((res) => {
            expect(res.body).to.deep.equal({});
            done();
          });
      });
      it('if the request is badly formed', (done) => {
        return request.put('/qwryaslx-zshas')
          .send({name: 'Ivysaur', type: 'SDF', level: 17})
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Bad Request');
            done();
          });
      });
    });
  });

  describe('Feature: Delete a pokemon throught its Id', () => {
    context('delete a pokemon if the pokemon exists', () => {
      it('..', (done) => {
        return request.delete('/'+pokemons[0].id)
          .expect(200)
          .then((res) => {
            return request.get('/'+pokemons[0].id)
              .expect(404)
              .then((res) => {
                expect(res.error.text).to.equal('Not Found');
                done();
              });
          });
      });
      it('if the pokemon does not exists', (done) => {
        return request.delete('/qwryaslx-zshas')
          .expect(400)
          .then((res) => {
            expect(res.error.text).to.equal('Didn\'t found a pokemon with id ${req.body.id}');
            done()
          });
      });
    });
  });


  /** Just for fun **/
  describe('Feature: Web Cache Validation', () => {
    context('When the ETAG header is aks for', () => {
      it('The header should be content ETAG header', (done) => {
        return request.get('/')
          .then((res) => {
            expect(res.header.etag).to.exist
            done();
          });
      });
    });
  });
  /** ********** **/
}); //AllFeactures
