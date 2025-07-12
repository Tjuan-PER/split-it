import { initializeApp }  from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, set , get} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://split-it-22c58-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
// const perPersonInDb = ref(database, "per-person")

// console.log(evenlyInDB, perPersonInDb)

const perPersonBtn = document.getElementById("per-person-btn")
const evenlyBtn = document.getElementById("evenly-btn")
const addNewPersonBtn = document.getElementById('add-new-person-btn')
const calculateBtn = document.getElementById("calculate-btn")
const newSessionBtn = document.getElementById('new-session-btn')
const splitInputField = document.getElementById('split-input-field')
const splitInputContainer = document.getElementById('split-input-field-container')
const orderSessionInDB = ref(database, "order-session")

const orderContainer = document.getElementById("order-container")
const orderSessionEl = document.getElementById("order-session")

const receiptEl = document.getElementById("receipt-el")

let splitEvenly = true
let count = 0

const GST = 0.05
const PST = 0.07

function clearInput(element){
    element.value = ""
}


function renderOrderSession(splitEvenly=true){
    onValue(orderSessionInDB, function(snapshot){
        clearSession(orderSessionEl)
        if (snapshot.exists()){
            let orderSession = Object.entries(snapshot.val())
            count = 0
            let max = (splitEvenly) ? 1 : orderSession.length
            for (let i = 0; i < max; i++){
                let name = orderSession[i][1]['name']
                let orders = orderSession[i][1]['orders']
                let index = i
                let personNum = index + 1
                let personEl = renderPerson(index, personNum, name, orders)
                orderSessionEl.append(personEl)
                count += 1
            }
        } else {
            console.log("No Orders yet...") 
            let newPersonEl = newCustomer(0, 1)
            orderSessionEl.append(newPersonEl)
        }
    })
}

evenlyBtn.addEventListener("click", function(){
    orderContainer.classList.remove('hidden')
    splitInputContainer.classList.remove('hidden')
    calculateBtn.classList.remove('hidden')
    addNewPersonBtn.classList.add('hidden')
    receiptEl.classList.add('hidden')
    receiptEl.innerHTML += ''
    splitEvenly = true
    renderOrderSession(splitEvenly)
})

perPersonBtn.addEventListener("click", function(){
    orderContainer.classList.remove('hidden')
    calculateBtn.classList.remove('hidden')
    addNewPersonBtn.classList.remove('hidden')
    splitInputContainer.classList.add('hidden')
    receiptEl.classList.add('hidden')
    receiptEl.innerHTML += ''
    splitEvenly = false
    // console.log("Split individually activated") 
    renderOrderSession(splitEvenly)
})

addNewPersonBtn.addEventListener("click", function(){
    let newPersonEl = newCustomer(count, count + 1)
    orderSessionEl.append(newPersonEl)
})

calculateBtn.addEventListener("click", function(){
    console.log("Button clicked")
    receiptEl.innerHTML = ''
    receiptEl.innerHTML += `
            <h1>Receipt</h1>
            <div class="border"></div>
            `
    get(orderSessionInDB).then((snapshot) => {
        if (snapshot.exists()){
            let orderSession = Object.entries(snapshot.val())
            if (splitEvenly) {
                if (splitInputField.textContent){
                    let subtotal = calculateSubtotal(orderSession[0][1]['orders'])
                    let taxAndTotal = calculateTaxAndTotal(subtotal)
                    let split = Number(splitInputField.textContent)
                    renderReceipt(subtotal, taxAndTotal[0], taxAndTotal[1], taxAndTotal[2], undefined, split)
                    receiptEl.classList.remove('hidden')
                    newSessionBtn.classList.remove('hidden')
                }
                
            } else {
                let groupSubtotal = 0
                for (let i = 0; i < orderSession.length; i++){
                    let name = orderSession[i][1]['name']
                    let subtotal = calculateSubtotal(orderSession[i][1]['orders'])
                    groupSubtotal += subtotal
                    let taxAndTotal = calculateTaxAndTotal(subtotal)
                    renderReceipt(subtotal, taxAndTotal[0], taxAndTotal[1], taxAndTotal[2], name)
                } 
                let taxAndTotal = calculateTaxAndTotal(groupSubtotal)
                renderReceipt(groupSubtotal, taxAndTotal[0], taxAndTotal[1], taxAndTotal[2])               
                receiptEl.classList.remove('hidden')
                newSessionBtn.classList.remove('hidden')
            }
        }
    })
})

newSessionBtn.addEventListener("click", function(){
    receiptEl.classList.add('hidden')
    splitInputField.innerHTML = '<p>2</p>'
    clearSessionInDB()
    newSessionBtn.classList.add('hidden')
    
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

splitInputContainer.addEventListener("click", function(e){
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
        if (amount > 2){
            amount -= 1
            orderLine.innerHTML = `<p>${amount}</p>`
            // console.log(amount)
        }
    }
})

function calculateTaxAndTotal(subtotal){
    let provincialSalesTax = subtotal * PST
    provincialSalesTax = provincialSalesTax
    let goodServiceTax = subtotal * GST
    goodServiceTax = goodServiceTax
    let total = subtotal + provincialSalesTax + goodServiceTax
    return [provincialSalesTax, goodServiceTax, total]
}

function renderReceipt(subtotal, provincialSalesTax, goodServiceTax, total, name = "Group Total", split = 0){
    let splitEl = (split) ? `<li><div>Each Person</div><div>$${(total / split).toFixed(2)}</div></li>` : ""
    receiptEl.innerHTML += `
        <div class="receipt">
            <p class="bold">${name}</p>
            <ul>
                <li><div>Subtotal</div><div>$${subtotal.toFixed(2)}</div></li>
                <li><div>PST</div><div>$${provincialSalesTax.toFixed(2)}</div></li>
                <li><div>GST</div><div>$${goodServiceTax.toFixed(2)}</div></li>
                <li><div>Total</div><div>$${total.toFixed(2)}</div></li>
                ${splitEl}
            </ul>
        </div>
        `
}

function calculateSubtotal(orders){
    let subtotal = 0
    for (const item in orders){
        subtotal += orders[item]['price'] * orders[item]['amount']
    }
    return subtotal
}

function clearSession(sessionEl) {
    sessionEl.innerHTML = ''
}

function clearSessionInDB(){
    remove(orderSessionInDB)
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
            <div id="${itemID}-price">$${itemPrice}</div>
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
        let inputValue = {'item':itemNameInputFieldEl.value.toLowerCase(), 
            'price':Number(itemPriceInputFieldEl.value).toFixed(2), 
            'amount':Number(orderAmountEl.textContent)}
        if (!(inputValue['item'] == "") 
            && inputValue['price'] > 0
            && inputValue['amount'] > 0){
            push(exactLocationOfPersonInDB, inputValue)
            console.log("Order added to database")  
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

function renderPerson(index, num, name = "", orders){
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

