window.onpopstate =  (e) => {
  load_mailbox(e.state.mailbox);
};

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => {
    compose_email();
  });

  // document.querySelectorAll('.btn-sm').forEach((buton) => {
  //   buton.addEventListener('click', () => {
  //     let mailbox = buton.dataset.url;
  //     history.pushState({mailbox: mailbox}, "", `${mailbox}`);
  //     mailbox = "";
  //   })
  // });

  // By default, load the inbox
  load_mailbox();
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Submit a new mail
  document.querySelector('#compose-btn-submit').addEventListener('click', () => {
    const recipient = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipient,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
        console.log(result);
    });

    load_mailbox('sent'); 

  });
}

function load_mailbox(mailbox = 'inbox') {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // ... Display mails...
      emails.forEach(email => {
        const n_element = document.createElement('div');
        n_element.className = "list-group-item";

        if (email.read === false) {
          n_element.style.backgroundColor = "#f6f6f6";
        } else {
          n_element.style.backgroundColor = "#ffffff";
        }

        if (mailbox === "sent" || mailbox === "archive") {
          n_element.style.backgroundColor = "#ffffff";
        }

        n_element.innerHTML = `
             <div class="container">
                <div class="row">
                  <div class="col">
                  ${email.sender}
                  </div>
                  <div class="col-6">
                  ${email.subject}
                  </div>
                  <div class="col">
                  ${email.timestamp}
                  </div>
                </div> 
        `; 
        n_element.addEventListener('click', function() {
            load_email(email.id);
        });
        document.querySelector('#emails-view').append(n_element);
        });
  });

}


function load_email(email_id) {
  
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = "";

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    const n_element = document.createElement('div');
    
    if (email.archived) {
      n_element.innerHTML = `
      <div class="row">
      <div class="col-sm-12">
        <div class="card">
          <div class="card-body">
            <p class="card-text">From: ${email.sender} </p>
            <p class="card-text">To: ${email.recipients} </p>
            <p class="card-text">Subject: ${email.subject} </p>
            <p class="card-text">Time: ${email.timestamp} </p>
            <p class="card-text">Body: ${email.body} </p>
            <a id="reply" href="#" class="btn btn-primary">Reply</a>
            <a id="archive" href="#" class="btn btn-danger">unarchive</a>
          </div>
        </div>
      </div>
      </div>
      `;
    } else {
      n_element.innerHTML = `
      <div class="row">
      <div class="col-sm-12">
        <div class="card">
          <div class="card-body">
            <p class="card-text">From: ${email.sender} </p>
            <p class="card-text">To: ${email.recipients} </p>
            <p class="card-text">Subject: ${email.subject} </p>
            <p class="card-text">Time: ${email.timestamp} </p>
            <a id="reply" href="#" class="btn btn-primary">Reply</a>
            <a id="archive" href="#" class="btn btn-danger">Archive</a>
            <hr>
            <p class="card-text">Body </p>
            <p class="card-text">${email.body} </p>
          </div>
        </div>
      </div>
      </div>
      `;
    }

    document.querySelector('#emails-view').append(n_element);

    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    });

    if (email.archived) {
      document.querySelector('#archive').addEventListener('click', () => {
        unarchive_email(email_id);
        load_mailbox('inbox')
      });
    } else {
      document.querySelector('#archive').addEventListener('click', () => {
        archive_email(email_id);
        load_mailbox('inbox')
      });  
    }

    document.querySelector('#reply').addEventListener('click', () => reply_email(email_id));
 
  });
}


function archive_email(email_id){

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })

}

function unarchive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
}

function reply_email(email_id) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // ... do something else with email ...
      document.querySelector('#compose-recipients').value = email.sender;

      if (email.subject.includes("RE", 0) || email.subject.includes("re", 0)) {
        document.querySelector('#compose-subject').value = `${email.subject}`;
      } else {
        document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
      }

      document.querySelector('#compose-body').value = `"On ${email.timestamp} ${email.sender} wrote : ${email.body}"`;
  });

  document.querySelector('#compose-btn-submit').addEventListener('click', () => {
    const recipient = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch(`/emails`, {
      method: "POST",
      body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent')
    })
  });

}
