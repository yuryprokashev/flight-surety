
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
        let displayWrapper = DOM.elid("display-wrapper");
        navs.forEach((navItem, index, arr) =>{
            navItem.addEventListener("click", ()=>{
                arr.forEach((item, idx, array) =>{
                    item.classList.remove("active");
                    formContainers[idx].style.display = "none";
                });
                navItem.classList.add("active");
                formContainers[index].style.display = "block";
                displayWrapper.innerHTML = "";
            });
        });

        DOM.elid("operational-status-get").addEventListener("click", async () => {
            let request = {
                from: DOM.elid("operational-status-get-from").value
            };
            let err, result;
            try {
                result = await contract.getOperationalStatus(request);
            } catch (e) {
                console.log(e);
                err = e;
            } finally {
                display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: err, value: result} ]);

            }
        });

        DOM.elid("airline-register").addEventListener("click", async () => {
            let airlineAddress = DOM.elid("airline-address");
            let from = DOM.elid("airline-register-from");
            let request = {
                airline: airlineAddress.value,
                from: from.value
            };
            let err, result, label
            try {
                await contract.registerAirline(request);
                label = "Success";
                result = "Airline is registered";
            } catch(e){
                console.log(e);
                label = "Failure";
                err = e;
            } finally {
                display(
                    "Register Airline",
                    "Registers new airline in the system, but does not allow it to vote without registration fee paid",
                    [{label: label, error: err, value: result}]
                )
            }
        });

        DOM.elid("register-flight").addEventListener("click", async ()=>{
            let request = {
                flight: DOM.elid("register-flight-flight-code").value,
                airline: DOM.elid("register-flight-airline-address").value,
                departure: new Date(DOM.elid("register-flight-departure").value).valueOf() / 1000,
                from: DOM.elid("register-flight-from").value
            };

            let err, result, label;
            try {
                await contract.registerFlight(request);
                label = "Success";
            } catch (e) {
                err = e;
                console.log(e);
                label = "Failure";
            } finally {
                display('Register Flight', 'Creates new flight in the system', [ { label: label, error: err, value: "Flight is registered"} ]);
            }
        });

        DOM.elid("submit-oracle").addEventListener("click", async () => {
            let request = {
                airline: DOM.elid("submit-oracle-airline-address").value,
                flight: DOM.elid("submit-oracle-flight-code").value,
                departure: new Date(DOM.elid("submit-oracle-departure").value).valueOf()/1000
            };
            let err, result;
            try {
                result = await contract.fetchFlightStatus(request);
            } catch (e) {
                console.log(e);
                err = e;
            } finally {
                display('Flight Status',
                    'Send the request to Oracle server to get the flight status code for this flight',
                    [
                        { label: 'Flight Status Code', error: err, value: result.status}
                        ]
                );

            }
        });

        DOM.elid("get-flight").addEventListener("click", async ()=>{
            let request = {
                flight: DOM.elid("get-flight-flight-id").value
            };

            let err, result, label;
            try {
                result = await contract.getFlight(request);
                label = "Success";
            } catch (e) {
                err = e;
                console.log(e);
                label = "Failure";
            } finally {
                display('Get Flight',
                    'Get flight from the system',
                    [
                        { label: "Airline Address", error: err, value: result.airlineAddress },
                        { label: "Code", error: err, value: result.flight },
                        { label: "Status", error: err, value: result.state },
                        { label: "Departure Status", error: err, value: result.departureStatusCode },
                        { label: "Departure", error: err, value: new Date(result.departureTimestamp.toNumber() * 1000) },
                        { label: "Updated", error: err, value: new Date(result.updated.toNumber() * 1000) },
                    ]
                );
            }
        });

        DOM.elid("buy-insurance").addEventListener("click", async ()=>{
            let request = {
                flight: DOM.elid("buy-insurance-flight-code").value,
                paid: DOM.elid("buy-insurance-paid-amount").value,
                from: DOM.elid("buy-insurance-from").value
            };

            let err, result, label;
            try {
                await contract.buyInsurance(request);
                label = "Success";
            } catch (e) {
                err = e;
                console.log(e);
                label = "Failure";
            } finally {
                display('Buy Insurance', 'Creates insurance for the passenger in the system', [ { label: label, error: err, value: "Insurance is bought"} ]);
            }
        });

        // User-submitted transaction
        DOM.elid('get-credited-amount').addEventListener('click', async () => {
            let request = {
                address: DOM.elid('get-credited-amount-passenger-address').value
            };
            let err, result, label;
            label = "Credited Amount";
            try {
                result = await contract.getCreditedAmount(request);
            } catch (e) {
                err = e;
                console.log(e);
            } finally {
                display('Get Credited Amount', 'Retrieves the amount credited for address', [ { label: label, error: err, value: result} ]);
            }
        });

        DOM.elid('withdraw-credited-amount').addEventListener('click', async () => {
            let request = {
                address: DOM.elid('withdraw-credited-amount-passenger-address').value,
                amount: DOM.elid("withdraw-credited-amount-amount").value,
                from: DOM.elid("withdraw-credited-amount-from").value
            };
            let err, result, label;

            try {
                result = await contract.withdrawAmount(request);
                label = "Success";
            } catch (e) {
                err = e;
                label = "Failure";
                console.log(e);
            } finally {
                display('Withdraw Credited Amount', 'Transfers the amount specified to given address', [ { label: label, error: err, value: "Amount Withdrawn"} ]);
            }
        });

        DOM.elid("get-insurance").addEventListener("click", async ()=>{
            let request = {
                id: DOM.elid("get-insurance-id").value
            };

            let err, result, label;
            try {
                result = await contract.getInsurance(request);
                label = "Success";
            } catch (e) {
                err = e;
                console.log(e);
                label = "Failure";
            } finally {
                display('Get Insurance',
                    'Get flight from the system',
                    [
                        { label: "Flight Id", error: err, value: result.flightId },
                        { label: "State", error: err, value: result.state },
                        { label: "Amount Paid", error: err, value: result.amountPaid },
                        { label: "Owner", error: err, value: result.owner },
                    ]
                );
            }
        });

    });
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    displayDiv.innerHTML = "";

    let section = DOM.section();
    let row = DOM.div({className: "row"});
    let titleContainer = DOM.div({className: "col-12"});
    titleContainer.appendChild(DOM.h5(title));
    let descContainer = DOM.div({className:"col-12"});
    descContainer.appendChild(DOM.p(description));
    row.appendChild(titleContainer);
    row.appendChild(descContainer);
    results.map((result) => {
        // let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    });
    displayDiv.append(section);

}







