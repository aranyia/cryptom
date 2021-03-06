var App = React.createClass({
    componentWillMount: function() {
      this.setupAjax();
      this.setState();
    },
    setupAjax: function() {
      $.ajaxSetup({
        'beforeSend': function(xhr) {
          if (localStorage.getItem('access_token')) {
            xhr.setRequestHeader('Authorization',
                  'Bearer ' + localStorage.getItem('access_token'));
          }
        }
      });
    },
    setState: function(){
      let accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        this.loggedIn = true;
      } else {
        this.loggedIn = false;
      }
    },
    render: function() {
      if (this.loggedIn) {
        return (<LoggedIn />);
      } else {
        return (<Home />);
      }
    }
});

var Home = React.createClass({
  authenticate: function() {
    let apiKey = $("input#api-key").val();

    $.post('/api/auth', JSON.stringify({'apiKey': apiKey}), function(authResult) {
      if (authResult.accessToken) {
        localStorage.setItem('access_token', authResult.accessToken);
      } else {
        console.error("Unexpected authentication error.");
      }
    }).fail(function(errorResponse) {
      console.error('Authentication error: ' + errorResponse.responseText);
    });
  },

  render: function() {
    return (
    <div className="container">
        <div className="col-xs-12 jumbotron text-left">
          <h3 className="display-4 text-primary" style={{marginBottom: '2.5rem'}}>cryptom</h3>
          <p className="lead">Welcome, please sign in.</p>

          <div className="card col-4">
            <div className="card-body">
            <form>
              <div className="form-group">
                <input type="password" className="form-control" id="api-key" placeholder="API key"/>
              </div>
            </form>
            <button onClick={this.authenticate} className="btn btn-primary btn-login btn-block">Sign in</button>
            </div>
          </div>
      </div>
    </div>);
  }
});

var LoggedIn = React.createClass({
  getInitialState: function() {
    return {
      portfolioValuations: [],
      stakes: [],
      performanceItems: []
    }
  },
  componentDidMount: function() {
    this.serverRequest = $.get('/api/portfolio', function (result) {
      this.setState({
        portfolioValuations: result.valuations,
        stakes: result.stakes,
      });
    }.bind(this));
    this.serverRequest = $.get('/api/performance', function (result) {
      this.setState({
        performanceItems: result,
      });
    }.bind(this));    
  },

  render: function() {
      return (
      <div className="container">
        <div className="col-xs-12 jumbotron text-left">
          <h3 className="display-4 text-primary" style={{marginBottom: '2.5rem'}}>cryptom</h3>

          <div className="row" style={{marginTop: '0.5rem', marginBottom: '1.5rem'}}>
            <PortfolioValuations key='portfolio-val' portfolioValuations={this.state.portfolioValuations} />
          </div>
          <div className="row">
            {this.state.stakes.map(function(stake, i){
              return <Stake key={stake.unit} stake={stake} />
            })}
          </div>

          <div className="row" style={{marginTop: '1.0rem', marginBottom: '0.5rem'}}>
            <div className="col">
              <h4 className="text-info">Performance</h4>
              <p className="lead">Performance indicators of last active trades by digital currency</p>
            </div>
          </div>
          <div className="row">
            {this.state.performanceItems.map(function(performance, i){
              return <PerformanceIndicator key={performance.unit} performance={performance} />
            })}
          </div>
        </div>
      </div>);
  }
});

var PortfolioValuations = React.createClass({
  render : function() {
    let valuations = this.props.portfolioValuations.map(function(valuation) {
      return (<span key={valuation.currency} style={{fontSize: '1.3rem', marginRight: '1.5rem'}}>
        <strong className="text-primary">{numeral(valuation.value).format('0.00 a')}</strong> <small>{valuation.currency}</small></span>);
    });

    return(
      <div className="col">
        <h4 className="text-info">Portfolio</h4>
        <p className="lead">Summary of digital currency portfolio with current valuations</p>
        <div className="container">
            {valuations}
        </div>
      </div>);
  }
});

var Stake = React.createClass({
    render : function() {
      let stake = this.props.stake;
      let valuations = stake.valuations.map(function(valuation) {
        let value = <span style={{fontSize: '1.3rem'}}><strong className="text-primary">{numeral(valuation.value).format('0.00 a')}</strong> <small>{valuation.currency}</small></span>;
        let valueUnit = <em style={{fontSize: '1rem', marginLeft: '1rem', paddingTop: '0.2rem'}}>{numeral(valuation.valueUnit).format('0,0.00')} <small>{valuation.currency} / {stake.unit}</small></em>;

        if (valuation.valueUnit != null) {
          return (
            <div key={valuation.currency} style={{marginBottom: '0.8em'}}>
              {value}{valueUnit}
            </div>);
        } else {
          return (
            <div key={valuation.currency} style={{marginBottom: '0.8em'}}>
              {value}
            </div>);
        }
      });

      return(
      <div className="col">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title text-info">{stake.unit}</h5>
            <h6 className="card-subtitle mb-2 text-muted">{numeral(stake.amount).format('0,0.0000')}</h6>
            <div className="card-text">
              {valuations}
            </div>
          </div>
        </div>
      </div>);
    }
});

var PerformanceIndicator = React.createClass({
  render: function() {
    let performance = this.props.performance;
    let indicatorColor = (performance.percentChange >= 0) ? 'green' : 'red';
    let activeSinceLine;
    if (performance.startedAt != null) {
      let activeSince = new Date(performance.startedAt);
      let days =  Math.floor((new Date() - activeSince) / (24 * 60 * 60 * 1000)); 
      activeSinceLine = <span style={{fontSize: '0.8rem'}}>Active for <strong>{days} days</strong> since {activeSince.getFullYear() + "-" + (activeSince.getMonth()+1) + "-" + activeSince.getDate()}</span>
    }

    return(
      <div className="col">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title text-info">{performance.unit}</h5>
            <h6 className="card-subtitle mb-2 text-muted">{numeral(performance.amount).format('0,0.0000')}</h6>
            <div className="card-text">
              <div key={performance.unit + "-perf-percent"} style={{marginBottom: '0.8em'}}>
                <span style={{fontSize: '1.3rem', color: indicatorColor}}><strong>{numeral(performance.percentChange).format('0.00')}%</strong></span>
              </div>
              <div key={performance.unit + "-perf-val-change"} style={{marginBottom: '0.8em'}}>
                <span style={{fontSize: '1.3rem'}}><strong className="text-primary">{numeral(performance.valueChange).format('0.00 a')}</strong> <small>{performance.currency}</small></span>
              </div>
              <div key={performance.unit + "-perf-active-since"}>
                {activeSinceLine}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));