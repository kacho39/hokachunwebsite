const crypto = require('crypto')
const knex = require('knex')(require('./knexfile'))
module.exports = {
  createUser ({ username, password }) {
    console.log(`Add user ${username}`)
    const { salt, hash } = saltHashPassword({ password })
    return knex('users').insert({
      salt,
      encrypted_password: hash,
      username
    }).debug()
  },
  authenticate ({ username, password }) {
    console.log(`Authenticating user ${username}`)
    return knex('users').where({ username })
      .then(([user]) => {
        if (!user) return { success: false }
        const { hash } = saltHashPassword({
          password,
          salt: user.salt
        })
        return { success: hash === user.encrypted_password, is_admin: user.is_admin }
      })
  },
  checkMyPrize ({ prize_token }) {
    console.log(`Get prize with token ${prize_token}`)
    return knex('scratchcard').where('prize_token', prize_token )
      .then((prizes) => {
        // for (row of rows) {
        //     console.log(`${row['id']} ${row['machine_name']} ${row['owner_name']}`);
        // }
        if (prizes.length < 1) return { success: false }

        return { success: true, prize: prizes[0] }
      })
  },storeWinnerDataAndReturnWinnerInfo({ name, hk_id, phone_no, email, token }) {
    console.log(`Store and return winner info of ${name}`)
    return knex('scratchcard').select('prize_token').where({
      prize_token: token
    }).from('scratchcard')
    .then((prize_tokens) => {
      if (prize_tokens.length != 0) {
        return knex('winner_info').where({ prize_token: prize_tokens[0]['prize_token']})
        .then((winner_info_have_prize_token) => {
          if (winner_info_have_prize_token.length == 0) {

            return knex('winner_info').insert([{
              name: name, 
              hk_id: hk_id, 
              phone_no: phone_no, 
              email: email,
              prize_token: prize_tokens[0].prize_token
            }]).then((inserted_ids) => {
              return knex('scratched_card')
              .where('prize_token', prize_tokens[0].prize_token)
              .update({
                scratched: 1,
                scratched_at: knex.fn.now()
              })
              .then(( updated ) => {

                return knex.select('name', 'hk_id', 'phone_no', 'email', 'winner_info.id', 'prize_id').from('winner_info').innerJoin('prize_tokens', 'prize_tokens.prize_token', 'winner_info.prize_token').innerJoin('prizes', 'prizes.id', 'prize_tokens.prize_id')
                .then((winner_infos) => {
                  // if (winner_infos) re
                  return { winner_infos }
                })
              })
            })

          } else {
            return knex.select('name', 'hk_id', 'phone_no', 'email', 'winner_info.id', 'prize_id').from('winner_info').innerJoin('prize_tokens', 'prize_tokens.prize_token', 'winner_info.prize_token').innerJoin('prizes', 'prizes.id', 'prize_tokens.prize_id')
            .then((winner_infos) => {
              // if (winner_infos) re
              return { winner_infos }
            })
          }
        })
      }
    })
  },
  checkMyPrizeAndUpdateScratchedAt ({ prize_token }) {
    console.log(`Get prize with token ${prize_token}`)
    return knex('scratchcard').where('prize_token', prize_token )
      .then((prizes) => {
        return knex('scratchcard').where('prize_token', prize_token)
        .update({
          // scratched: 1,
          scratched_at: knex.fn.now()
        })
        .then(( updated ) => {
          
          if (prizes.length < 1) return { success: false }

          return { success: true, prize: prizes[0] }
        })
        // for (row of rows) {
        //     console.log(`${row['id']} ${row['machine_name']} ${row['owner_name']}`);
        // }
      })
  },
  checkWinner ({  }) {
    console.log(`Check Winner`)
    return knex('scratchcard').where('scratched', 1)
    .then((prizes_array) => {
      // return { prizes_array: prizes_array }
        return knex('winner_info')
        .then(( winners_array) => {
          return { prizes_array: prizes_array, winners_array: winners_array}
        })
    })
  },
  getAllEvent ({ owner_name }) {
    console.log(`Get all events of ${owner_name}`)
    return knex('event').innerJoin('users', 'users.id', 'event.owner_id').where('username', owner_name)
      .then((events) => {
        if (!events) return { success: false }

        return { events }
      })
  },
  getEventDetail ({ event_id }) {
    console.log(`Get event detail of ${event_id}`)
    return knex('event').where('id', event_id)
      .then((event_detail_array) => {
        // if (!event_detail_array) return { success: false }

        return knex('scratchcard').select('scratchcard.id', 'prize_name', 'scratched_at').where('event_id', event_id).leftJoin('prize', 'scratchcard.prize_id', 'prize.id')
        .then((scratchcard_array) => {
          return { event_detail: event_detail_array[0], scratchcard_array }
        })

        // return { event_detail: event_detail_array[0] }
      })
  },
  getEventAllPrize ({ event_id }) {
    console.log(`Get all prize of event ${event_id}`)
    return knex('scratchcard').select('prize_id', 'prize_name').groupBy('prize_id').where('event_id', event_id).innerJoin('prize', 'scratchcard.prize_id', 'prize.id')
      .then((prize_id_array) => {
        // if (!scratchcard) return { success: false }
        // console.log(prize_id_array)
        return { prize_id_array }
      })
  },
}
function saltHashPassword ({
  password,
  salt = randomString()
}) {
  const hash = crypto
    .createHmac('sha512', salt)
    .update(password)
  return {
    salt,
    hash: hash.digest('hex')
  }
}
function randomString () {
  return crypto.randomBytes(4).toString('hex')
}