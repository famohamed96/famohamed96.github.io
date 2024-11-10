let projects= []
let skills = [];
let xp = 0;

const graphqlQuery = `
query User {
    user {      
        auditRatio
        firstName
        id
        lastName
        login
        totalDown
        totalUp
    }
}
`;


const Mlevel=  `
query Transaction {
    transaction(
        where: { type: { _ilike: "level" }, eventId: { _eq: 20 } }
        order_by: {createdAt: desc}
    ) {
        amount
        path
        type
        eventId
    }
}
`;

const skillsQuery = ` query test{
    user{
      transactions(
        order_by: [{type: desc}, {amount: desc}]
        distinct_on: [type]
        where: {type: {_in: ["skill_js", "skill_go", "skill_html", "skill_prog", "skill_front-end","skill_algo", "skill_back-end"]}}
      ) {
        type
        amount
      }
    }
  }
    `;


    const xpPerProject= `
    query Transaction{
        transaction(
            where: { eventId: { _eq: 20 }, type: { _eq: "xp" } 
               _and: [{ path: { _nilike: "%checkpoint%" }  }]
                }
            order_by: {createdAt: desc}
        ) {
            amount
            createdAt
            path
        }
    }  `;


    const modXp=  ` 
    query Transaction {
        transaction(
            where: { type: { _eq: "xp" }, eventId: { _eq: 20 } }
            ) {
            amount
            path
        }
    }
    `;


// Dashboard handler
const handleUserDataError = (error) => {
    console.error('Error fetching user data:', error);
    // Additional error handling logic if needed
}

const updateUI = (data) => {
    const user = data.data.user[0];
    const userName = user.login;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const auditRatio = user.auditRatio.toFixed(1);
    const totalUp = user.totalUp;
    const totalDown = user.totalDown;

    document.getElementById('userName').textContent = userName;
    document.getElementById('auditRatio').textContent = auditRatio;
    document.querySelector('h1').textContent = `Welcome, ${firstName} ${lastName}!`;

    createSVGWithBars(totalUp,totalDown);
}

const dashboardHandler = async () => {
    try {
        fetchUserData(graphqlQuery)
            .then(data => {
                updateUI(data);
                return fetchUserData(modXp);
            })
            .then(data => {
                let xp = data.data.transaction.reduce((acc, curr) => acc + curr.amount, 0);
                document.getElementById('xp').textContent = Math.round(xp/1000) + 'KB';
                return fetchUserData(Mlevel);
            })
            .then(data => {
                const level = data.data.transaction[0].amount;
                document.getElementById('level').textContent = level;
                return fetchUserData(xpPerProject);
            })
            .then(data => {
                createBarChart(data.data);
                return fetchUserData(skillsQuery)
            }).then(data => {
                skills = processSkillData(data.data.user[0].transactions);
                createDonutChart();
            })
            .catch(handleUserDataError);
    } catch (error) {
        console.error('Error in processing data:', error);
    }
}

const fetchUserData = async (query) => {
    const jwtToken = localStorage.getItem('jwtToken');
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });

        const data = await response.json();
        console.log("Response Data:", data);
        return data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

dashboardHandler();
    function createSVGWithBars(totalUp,totalDown) {
        const svgContainer = document.getElementById('svgContainer');
        const svgNS = "http://www.w3.org/2000/svg";
       // Calculate the ratio for widths
const maxwidth = 100; // Define a maximum width percentage for the bars
const widthDown = (totalDown / (totalDown + totalUp)) * maxwidth;
const widthUp = (totalUp / (totalDown + totalUp)) * maxwidth;

console.log("widthDown", widthDown, "  ", "widthUp", widthUp);

// Create SVG with viewBox for responsiveness
const svg = document.createElementNS(svgNS, 'svg');
svg.setAttribute('viewBox', '0 0 400 120');
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
svg.style.width = '100%';
svg.style.height = 'auto';

// Bar for totalDown
const rectDown = document.createElementNS(svgNS, 'rect');
rectDown.setAttribute('x', '10%');
rectDown.setAttribute('y', '30');
rectDown.setAttribute('width', `${widthDown}%`);
rectDown.setAttribute('height', '10');
rectDown.setAttribute('fill', 'white');
svg.appendChild(rectDown);

// Text label for totalDown
const textDown = document.createElementNS(svgNS, 'text');
textDown.setAttribute('x', '10%');
textDown.setAttribute('y', '25');
textDown.setAttribute('fill', 'white');
textDown.style.fontSize = '18px';
textDown.textContent = "Received: " + formatBytes(totalDown, 2);
svg.appendChild(textDown);

// Bar for totalUp
const rectUp = document.createElementNS(svgNS, 'rect');
rectUp.setAttribute('x', '10%');
rectUp.setAttribute('y', '80');
rectUp.setAttribute('width', `${widthUp}%`);
rectUp.setAttribute('height', '10');
rectUp.setAttribute('fill', 'lightblue');
svg.appendChild(rectUp);

// Text label for totalUp
const textUp = document.createElementNS(svgNS, 'text');
textUp.setAttribute('x', '10%');
textUp.setAttribute('y', '75');
textUp.setAttribute('fill', 'white');
textUp.style.fontSize = '18px';
textUp.textContent = "Done: " + formatBytes(totalUp, 2);
svg.appendChild(textUp);

// Append the SVG to the container
svgContainer.innerHTML = ''; // Clear previous content
svgContainer.appendChild(svg);

    }
        
        
    // function formatBytes(bytes) {
    //     if (bytes === 0) return '0 Bytes';
    //     const k = 1024;
    //     const sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    //     const i = Math.floor(Math.log(bytes) / Math.log(k));
    //     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    // }


    const skillColors = {
        skill_prog: '#4A3267',
        skill_js: '#DE638A',
        skill_html: '#F7B9C4',
        skill_go: '#614484',
        "skill_front-end": '#F3D9E5',
        "skill_back-end": '#DE638A',
        skill_algo: '#C6BADE',
        default: '#000000'
    };
    

    const assignSkillColor = (type) => skillColors[type] || skillColors.default;
    
    const processSkillData = (skills) => {
        return skills.map(skill => ({
            type: skill.type,
            amount: skill.amount,
            color: assignSkillColor(skill.type)
        }));
    };
    

    function createDonutChart() {
        const total = skills.reduce((acc, skill) => acc + skill.amount, 0);
        const tooltip = document.getElementById("tooltip");
    
        const svgNS = "http://www.w3.org/2000/svg";
        const chart = document.createElementNS(svgNS, "svg");
        chart.setAttribute("width", 200);
        chart.setAttribute("height", 200);
        chart.setAttribute("viewBox", "0 0 42 42");
    
        let cumulativePercent = 0;
    
        // Create a list container for skills
        const skillListContainer = document.createElement("div");
        skillListContainer.style.marginLeft = "20px"; // Add some space from the chart
        skillListContainer.style.display = "inline-block"; // Align next to the chart
    
        skills.forEach(skill => {
            const circle = document.createElementNS(svgNS, "circle");
            const radius = 15.91549431;
            const circumference = 2 * Math.PI * radius;
            const percent = skill.amount / total;
            const dashArray = `${percent * 100} ${100 - percent * 100}`;
            const offset = cumulativePercent * circumference;
    
            circle.setAttribute("cx", 21);
            circle.setAttribute("cy", 21);
            circle.setAttribute("r", radius);
            circle.setAttribute("fill", "transparent");
            circle.setAttribute("stroke", skill.color);
            circle.setAttribute("stroke-width", 3.2);
            circle.setAttribute("stroke-dasharray", dashArray);
            circle.setAttribute("stroke-dashoffset", -offset);
    
            // Tooltip functionality
            circle.addEventListener("mouseover", (e) => {
                tooltip.style.opacity = 1;
                tooltip.textContent = `${skill.type}: ${skill.amount}%`;
            });
    
            circle.addEventListener("mousemove", (e) => {
                tooltip.style.left = e.pageX + 10 + "px";
                tooltip.style.top = e.pageY + 10 + "px";
            });
    
            circle.addEventListener("mouseleave", () => {
                tooltip.style.opacity = 0;
            });
    
            chart.appendChild(circle);
            cumulativePercent += percent;
    
            // Create a list item for each skill
            const skillItem = document.createElement("div");
            skillItem.textContent = `${skill.type}: ${skill.amount}%`;
            skillItem.style.color = '#313445'; // Match the color of the skill
            skillListContainer.appendChild(skillItem);
        });
    
        // Append the chart and skill list to the container
        const chartContainer = document.getElementById("donut-chart-container");
        chartContainer.innerHTML = ""; // Clear previous content
        chartContainer.appendChild(chart);
        chartContainer.appendChild(skillListContainer); // Add the skill list
    }

    function createBarChart(data) {
        // Set initial dimensions (these are used for aspect ratio calculation)
        const svgWidth = 600;
        const svgHeight = 300;
        const margin = { top: 20, right: 30, bottom: 70, left: 40 };
        const chartWidth = svgWidth - margin.left - margin.right;
        const chartHeight = svgHeight - margin.top - margin.bottom;
    
        const projects = data.transaction.map(item => item.path.split('/').filter(Boolean).pop());
        const amounts = data.transaction.map(item => item.amount);
        const maxAmount = Math.max(...amounts);
    
        const xScale = d3.scaleBand()
            .domain(projects)
            .range([0, chartWidth])
            .padding(0.1);
    
        const yScale = d3.scaleLinear()
            .domain([0, maxAmount])
            .range([chartHeight, 0]);
    
        // Clear previous chart if exists
        document.getElementById("xpPerProject").innerHTML = '';
    
        // Create the SVG element with responsive attributes
        const svg = d3.select("#xpPerProject")
            .append("svg")
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%");
    
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        // Create bars
        chart.selectAll(".bar")
            .data(data.transaction)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.path.split('/').filter(Boolean).pop()))
            .attr("y", d => yScale(d.amount))
            .attr("width", xScale.bandwidth())
            .attr("height", d => chartHeight - yScale(d.amount))
            .attr("fill", '#DE638A')
            .on('mouseover', function (e, d) {
                tooltip.style.opacity = 1;
                tooltip.textContent = `${d.path.split('/').filter(Boolean).pop()}: ${formatBytes(d.amount, 0)}`;
                tooltip.style.left = e.pageX + 10 + "px";
                tooltip.style.top = e.pageY + 10 + "px";
            })
            .on('mouseleave', () => tooltip.style.opacity = 0);
    
        // Create x-axis
        const xAxis = d3.axisBottom(xScale);
        chart.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    
        // Create y-axis
        const yAxis = d3.axisLeft(yScale);
        chart.append("g").call(yAxis);
    }
    


function formatBytes(bytes,fix) {
    let value;
    let unit;

    // Determine the number of digits
    const digitCount = Math.floor(Math.log10(bytes)) + 1;

    if (digitCount <= 3) { // 1 to 999 bytes
        value = bytes; // Leave in bytes
        unit = 'B';
    } else if (digitCount <= 6) { // 1000 to 999999 bytes
        value = bytes / 1000; // Convert to KB
        unit = 'KB';
    } else { // 1,000,000 bytes and above
        value = bytes / 1000000; // Convert to MB
        unit = 'MB';
    }

    // Format value to two decimal places
    return `${value.toFixed(fix)} ${unit}`;
}

function handleLogout() {
    // Clear the JWT token from localStorage
    localStorage.removeItem('jwtToken');

    window.location.href = '/index.html'; 
}


// function createBarChart(data) {
//     const svgWidth = 400;
//     const svgHeight = 300;
//     const margin = { top: 20, right: 20, bottom: 50, left: 50 }; // Increased bottom margin for x-axis labels
//     const chartWidth = svgWidth - margin.left - margin.right;
//     const chartHeight = svgHeight - margin.top - margin.bottom;

//     const projects = data.transaction.map(item => item.path.split('/').filter(Boolean).pop());
//     const amounts = data.transaction.map(item => item.amount);

//     const maxAmount = Math.max(...amounts);

//     const xScale = (index) => ((chartWidth / projects.length) * index) + margin.left;
    
//     const yScale = (value) => {
//         const scaledHeight = chartHeight * (value / maxAmount);
//         return chartHeight - scaledHeight + margin.top;
//     };

//     // Clear previous chart if exists
//     const chartContainer = document.getElementById("xpPerProject");
//     chartContainer.innerHTML = '';

//     const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     svg.setAttribute("width", svgWidth);
//     svg.setAttribute("height", svgHeight);

//     // Draw Y-axis line
//     const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
//     yAxisLine.setAttribute("x1", margin.left);
//     yAxisLine.setAttribute("x2", margin.left);
//     yAxisLine.setAttribute("y1", margin.top);
//     yAxisLine.setAttribute("y2", svgHeight - margin.bottom);
//     yAxisLine.setAttribute("stroke", "#000");
//     yAxisLine.setAttribute("stroke-width", 1);
//     svg.appendChild(yAxisLine);

//     // Draw X-axis line
//     const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
//     xAxisLine.setAttribute("x1", margin.left);
//     xAxisLine.setAttribute("x2", svgWidth - margin.right);
//     xAxisLine.setAttribute("y1", svgHeight - margin.bottom);
//     xAxisLine.setAttribute("y2", svgHeight - margin.bottom);
//     xAxisLine.setAttribute("stroke", "#000");
//     xAxisLine.setAttribute("stroke-width", 1);
//     svg.appendChild(xAxisLine);

//     // Add Y-axis tick marks and labels
//     const yAxisTicks = 5; // Number of ticks on the Y-axis
//     for (let i = 0; i <= yAxisTicks; i++) {
//         const yValue = (maxAmount / yAxisTicks) * i; // Value for the tick
//         const yPosition = yScale(yValue); // Scaled Y position for the tick

//         // Create a line for each tick
//         const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
//         tickLine.setAttribute("x1", margin.left - 5);
//         tickLine.setAttribute("x2", margin.left);
//         tickLine.setAttribute("y1", yPosition);
//         tickLine.setAttribute("y2", yPosition);
//         tickLine.setAttribute("stroke", "#000");
//         svg.appendChild(tickLine);

//         // Create text for each tick
//         const tickText = document.createElementNS("http://www.w3.org/2000/svg", "text");
//         tickText.setAttribute("x", margin.left - 10);
//         tickText.setAttribute("y", yPosition + 4); // Center text on tick line
//         tickText.setAttribute("text-anchor", "end");
//         tickText.setAttribute("font-size", "10");
//         tickText.textContent = Math.round(yValue); // Display rounded tick value
//         svg.appendChild(tickText);
//     }

//     // Create bars and X-axis labels
//     data.transaction.forEach((d, i) => {
//         const barHeight = chartHeight * (d.amount / maxAmount);

//         const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
//         rect.setAttribute("class", "bar");
//         rect.setAttribute("x", xScale(i));
//         rect.setAttribute("y", yScale(d.amount));
//         rect.setAttribute("width", chartWidth / projects.length - 10);
//         rect.setAttribute("height", Math.max(0, barHeight));
//         rect.setAttribute("fill", '#DE638A');

//         rect.addEventListener('mouseover', (e) => {
//             tooltip.style.opacity = 1;
//             tooltip.textContent = `${d.path.split('/').filter(Boolean).pop()}: ${d.amount}`;
//             tooltip.style.left = e.pageX + 10 + "px";
//             tooltip.style.top = e.pageY + 10 + "px";
//         });

//         rect.addEventListener('mouseleave', () => tooltip.style.opacity = 0);

//         svg.appendChild(rect);


//     });

//     // Append SVG to the chart container
//     chartContainer.appendChild(svg);
// }





    // createBarChart(data);