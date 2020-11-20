import React, { useState } from "react";
import handlers from "../../lib/handlers";
import * as S from "./styled";

const Search = () => {
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e) => {
    handlers.queryPVsRetrieval(e, value);
  };

  return (
    <S.Input type="text" placeholder="Search ..." value={value} onChange={handleChange} onKeyDown={handleSubmit} />
  );
};
export default Search;
