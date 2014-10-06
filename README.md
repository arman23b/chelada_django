djangoStarter
===
A quick way to start a new Django Project. Projects come ready to run on Heroku.



note: you will need [Virtualenv](https://pypi.python.org/pypi/virtualenv) and [Git](http://git-scm.com/) installed. If you want to put your project on [Heroku](https://www.heroku.com/), you will also need to install the [Heroku toolbelt](https://toolbelt.heroku.com/) and have a [Heroku account](https://id.heroku.com/signup) to which you have [uploaded your ssh key](https://devcenter.heroku.com/articles/keys) and are logged in (`heroku login`).

### Initializing
1. Clone this repository
	1. `git clone https://github.com/jackm321/djangoStarter.git`
2. Change the name of the directory you just cloned from djangoStarter to the name you want for your project
	1. `mv djangoStarter new_project_name`
3. cd into the project directory
	1. `cd new_project_name`
3. Run the initialization script
	1. `python setup.py`
4. Create the virtual environment
	1. `virtualenv venv --distribute`
5. Activate the virtual environment
	1. Mac/Linux: `source venv/bin/activate`
	2. Windows: `venv\scripts\activate.bat`
6. Install required Python packages
	1. `pip install -r requirements.txt`
7. run server
	* Mac/Linux(port [5000](http://localhost:5000/)): `foreman start`
	* Windows(port [8000](http://localhost:8000/)): `python manage.py runserver`

### Git
1. create a new git repository
	1. `git init`
2. create an initial commit
	1. `git add . && git commit -m "initial commit"`

### Heroku
1. create a new Heroku app
	1. `heroku create [new_project_name]`
		1. note that project names are optional when creating a new Heroku project but if you do specify one then it must be unique accross all Heroku users
2. push your code to Heroku
	1. `git push heroku master`
3. go visit your project on Heroku
	1. `heroku open`
