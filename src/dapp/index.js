
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        let navs = ["contract-resource", "airlines-resource", "flights-resource", "insurances-resource"].map(item=>{
            return DOM.elid(item);
        });
        let formContainers = ["contract-resource-forms", "airlines-resource-forms", "flights-resource-forms", "insurances-resource-forms"].map(item=>{
            return DOM.elid(item);
        });
        console.log(formContainers);
        navs.forEach((navItem, index, arr) =>{
            navItem.addEventListener("click", ()=>{
                arr.forEach((item, idx, array) =>{
                    item.classList.remove("active");
                    formContainers[idx].style.display = "none";
                });
                navItem.classList.add("active");
                formContainers[index].style.display = "block";
            });
        });


        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-code').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid("operational-status-get").addEventListener("click", () => {
            contract.isOperational((error, result) => {
                console.log(error,result);
                display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
        });

        DOM.elid("airline-register").addEventListener("click", () => {
            let airlineAddress = DOM.elid("airline-address").value;
            contract.registerAirline(airlineAddress, (error, result) => {
                console.log(error,result);
                display('Register Airline', 'Creates new airline in the system', [ { label: 'Success', error: error, value: "Airline is registered"} ]);
            });
        });
    });
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    displayDiv.innerHTML = "";
    let section = DOM.section();
    let row = DOM.div({className: "row"});
    let titleContainer = DOM.div({className: "col-12"});
    titleContainer.appendChild(DOM.h3(title));
    let descContainer = DOM.div({className:"col-12"});
    descContainer.appendChild(DOM.p(description));
    results.map((result) => {
        // let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    });
    displayDiv.append(section);

}







