import React, { Component } from 'react';
import handlers from '../lib/handlers';

class SearchPV extends Component{
    constructor(props){
        super(props);
        this.state = { value:'' };
    }

    handleChange = (e)=>{
        this.setState({value:e.target.value});
    }

    handleSubmit = (e)=>{
        handlers.queryPVsRetrieval(e, this.state.value);
    }

    render(){
       return <input class="search-input" type="text"  placeholder="Search ..." value={this.state.value} onChange={this.handleChange} onKeyDown={this.handleSubmit}/>
    }
}
export default SearchPV;
