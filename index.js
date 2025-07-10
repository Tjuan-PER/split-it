import { initializeApp }  from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://split-it-22c58-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const equallyInDB = ref(database, "order-session")
// const perPersonInDb = ref(database, "per-person")

// console.log(equallyInDB, perPersonInDb)

const perPersonBtn = document.getElementById("per-person-btn")
const equallyBtn = document.getElementById("equally-btn")
const calculateBtn = document.getElementById("calculate-btn")

const orderContainer = document.getElementById("order-container")
const orderSessionEl = document.getElementById("order-session")

const receiptEl = document.getElementById("receipt-el")
let splitEqually = true

function clearInput(element){
    element.value = ""
}

equallyBtn.addEventListener("click", function(){
    orderContainer.classList.remove('hidden')
    splitEqually = true
})

perPersonBtn.addEventListener("click", function(){
    orderContainer.classList.remove('hidden')
    splitEqually = false
    console.log("Split individually activated") 
})

calculateBtn.addEventListener("click", function(){

})

orderContainer.addEventListener("click", function(e){
    if (e.target.className == "add-btn"){
        const orderLine = e.target.parentNode.firstElementChild
        let amount = Number(orderLine.textContent)
        amount += 1
        orderLine.innerHTML = `<p>${amount}</p>`
        // console.log(amount)
    }
    if (e.target.className == "subtract-btn"){
        const orderLine = e.target.parentNode.firstElementChild
        let amount = Number(orderLine.textContent)
        if (amount > 0){
            amount -= 1
            orderLine.innerHTML = `<p>${amount}</p>`
            // console.log(amount)
        }
    }
})

function clearSession(sessionEl) {
    sessionEl.innerHTML = ''
}

function loadOrders(index, orderListEl, orders){
    for (const order in orders){
        let itemID = order
        let item = orders[order]
        let itemName = item['item']
        let itemPrice = item['price']
        let itemAmount = item['amount']
        // console.log(itemName, itemPrice, itemAmount)
        let itemEl = document.createElement("li")
        itemEl.innerHTML = `
            <div id="${itemID}-item">${itemName}</div>
            <div id="${itemID}-price">${itemPrice}</div>
            <div id="${itemID}-amount">${itemAmount}</div>
        `

        itemEl.addEventListener("click", function(){
            console.log(itemID)
            let exactLocationOfItemInDB = ref(database, `order-session/${index}/orders/${itemID}`)
            
            remove(exactLocationOfItemInDB)
        })

        orderListEl.append(itemEl)
    }
}

function createInputAndAddOrderElements(index, num, personNameInputField){
    let inputOrderEl = document.createElement("div")
    inputOrderEl.classList.add('new-order')

    let itemNameInputFieldEl = document.createElement("input")
    itemNameInputFieldEl.id = `person-${num}-order-item`
    itemNameInputFieldEl.type = "text"
    itemNameInputFieldEl.placeholder = "Add order..."
    inputOrderEl.append(itemNameInputFieldEl)

    let itemPriceInputFieldEl = document.createElement("input")
    itemPriceInputFieldEl.id = `person-${num}-order-price`
    itemPriceInputFieldEl.type = "text"
    itemPriceInputFieldEl.placeholder = "$..."
    itemPriceInputFieldEl.style.width = "60px"
    inputOrderEl.append(itemPriceInputFieldEl)

    ////////
    let itemAmountInputFieldEl = document.createElement("div")
    itemAmountInputFieldEl.classList.add("order-amount-btns")
    
    let orderAmountEl = document.createElement("div")
    orderAmountEl.id = "person-${num}-item-amount"
    orderAmountEl.classList.add("order-amount")
    orderAmountEl.innerHTML = '<p>0</p>'

    itemAmountInputFieldEl.append(orderAmountEl)

    let subtractOrderAmountBtn = document.createElement("button")
    subtractOrderAmountBtn.classList.add("subtract-btn")
    subtractOrderAmountBtn.id = `subtract-amount-btn-person-${num}`
    subtractOrderAmountBtn.textContent = '-'

    itemAmountInputFieldEl.append(subtractOrderAmountBtn)

    let addOrderAmountBtn = document.createElement("button")
    addOrderAmountBtn.classList.add("add-btn")
    addOrderAmountBtn.id = `add-amount-btn-person-${num}`
    addOrderAmountBtn.textContent = '+'

    itemAmountInputFieldEl.append(addOrderAmountBtn)

    inputOrderEl.append(itemAmountInputFieldEl)

    let newOrderBtn = createAddItemButton(personNameInputField, itemNameInputFieldEl, itemPriceInputFieldEl, orderAmountEl, index, num)

    return [inputOrderEl, newOrderBtn]
}

function createAddItemButton(personNameInputField, itemNameInputFieldEl, 
    itemPriceInputFieldEl, orderAmountEl, index, num){

        
    let newOrderBtn = document.createElement("button")
    newOrderBtn.classList.add('add-order-btn')
    newOrderBtn.id = `add-order-btn-${num}`
    newOrderBtn.textContent = "Add item(s)"

    newOrderBtn.addEventListener('click', function(){
        // Add new order to database
        if (personNameInputField.value){
            let personName = personNameInputField.value
            let personNameLocationInDB = ref(database, `order-session/${index}/name`)
            set(personNameLocationInDB, personName).then(()=>{
                console.log("Name successfully changed!")
            })
        }
        
        let exactLocationOfPersonInDB = ref(database, `order-session/${index}/orders`)
        let inputValue = {'item':itemNameInputFieldEl.value, 
            'price':Number(itemPriceInputFieldEl.value), 
            'amount':Number(orderAmountEl.textContent)}
        if (!(inputValue['item'] == "") 
            && inputValue['price'] > 0
            && inputValue['amount'] > 0){
            push(exactLocationOfPersonInDB, inputValue)
            clearInput(itemNameInputFieldEl)
            clearInput(itemPriceInputFieldEl)
            orderAmountEl.innerText = '0'
        } else {
            console.log('Nothing to add')
        }
    })

    return newOrderBtn
}

function createPersonNameInputField(num){
    let personNameInputField = document.createElement("input")
    personNameInputField.id = `person-${num}-name`
    personNameInputField.type = "text"
    personNameInputField.classList.add("person-name")
    personNameInputField.placeholder = `Person ${num}`

    return personNameInputField
}

function createNewOrderListEl(num){
    let orderListEl = document.createElement("ul")
    orderListEl.id = `person-${num}-order-list`
    return orderListEl
}

function createNewPersonDiv(num){
    let newPerson = document.createElement("div")
    newPerson.classList.add('person')
    newPerson.id = `person-${num}`

    return newPerson
}

function renderDB(index, num, name = "", orders){
    // Create a div element for person
    let person = createNewPersonDiv(num)

    let personNameInputField = createPersonNameInputField(num)
    person.append(personNameInputField)

    // Place their name in the personNameInputfield
    if (name){
        personNameInputField.value = name
    }

    // Creates list of orders from person
    let orderListEl = createNewOrderListEl(num)

    // Loads orders if orders exist
    if (orders){
        loadOrders(index, orderListEl, orders)
    }
    // Add existing orders to newPerson element
    person.append(orderListEl)

    // Create and add new order input field and addOrderButton
    let inputAndAddOrder = createInputAndAddOrderElements(index, num, personNameInputField) 
    let inputOrderField = inputAndAddOrder[0]  
    let addNewOrderBtn = inputAndAddOrder[1]
    person.append(inputOrderField)
    
    person.append(addNewOrderBtn)

    return person
}

function newCustomer(index, num){
    // Create a div element for person
    let newPerson = createNewPersonDiv(num)

    let personNameInputField = createPersonNameInputField(num)
    newPerson.append(personNameInputField)

    // Place their name in the personNameInputfield
    personNameInputField.value = `Person ${num}`

    // Creates list of orders from person
    let orderListEl = createNewOrderListEl(num)

    // Add existing orders to newPerson element
    newPerson.append(orderListEl)

    // Create and add new order input field and addOrderButton
    let inputAndAddOrder = createInputAndAddOrderElements(index, num, personNameInputField) 
    let inputOrderField = inputAndAddOrder[0]  
    let addNewOrderBtn = inputAndAddOrder[1]
    newPerson.append(inputOrderField)
    
    newPerson.append(addNewOrderBtn)

    return newPerson
    
}

// onValue(equallyInDB, function(snapshot){
//     clearSession(orderSessionEl)
//     if (snapshot.exists()){
//         let person = Object.entries(snapshot.val())
//         let name = person[0][1]['name']
//         let orders = person[0][1]['orders']
//         let index = 0
//         let personNum = index + 1
//         let personEl = renderDB(index, personNum, name, orders)
//         orderSessionEl.append(personEl)
//     } else {
//         console.log("No Orders yet...") 
//         let newPersonEl = newCustomer(0, 1)
//         orderSessionEl.append(newPersonEl)
//     }
// })

onValue(equallyInDB, function(snapshot){
    clearSession(orderSessionEl)
    if (snapshot.exists()){
        let person = Object.entries(snapshot.val())
        for (let i = 0; i < person.length; i++){
            let name = person[i][1]['name']
            let orders = person[i][1]['orders']
            let index = i
            let personNum = index + 1
            let personEl = renderDB(index, personNum, name, orders)
            orderSessionEl.append(personEl)
        }
    } else {
        console.log("No Orders yet...") 
        let newPersonEl = newCustomer(0, 1)
        orderSessionEl.append(newPersonEl)
    }
})