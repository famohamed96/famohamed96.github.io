loginHandler()


// Login handler
function loginHandler() {
  
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('error-message');
   
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
    
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const credentials = `${username}:${password}`;
            const encodedCredentials = btoa(credentials);
    
            try {
                const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`
                    }
                });
            
                if (response.ok) {
                    errorMessage.style.display = 'none';
                    
                    // Assuming the response contains the JWT token
                    const responseData = await response.json();
                    console.log(responseData)
                    const jwtToken = responseData;
            
                    // Save the JWT token securely (e.g., in local storage)
                    localStorage.setItem('jwtToken', jwtToken); 
                    window.location.href = 'graphql.html';

    
                } else {
                    errorMessage.innerText = 'Invalid credentials. Please try again.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
                errorMessage.innerText = `An error occurred: ${error.message}`; // Displaying the error message
                            errorMessage.style.display = 'block';
            }
        });
    
    });
  
}
