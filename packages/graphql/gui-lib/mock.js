import React, { Component } from "react";
import { connect } from "react-fela";
import Header from "./components/Header";
import PathList from "./components/PathList";
import Input from "./components/Input";
import Label from "./components/Label";
import Section from "./components/Section";
import Button from "./components/Button";
import MultiSelect from "./components/MultiSelect";
import { ONE_BLACK, ONE_GRAY } from "./constants/colors";
import Select from "./components/Select";
import TextArea from "./components/TextArea";
import sqlFormatter from "sql-formatter";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-pgsql";
import "ace-builds/src-noconflict/theme-github";

const style = {
  foobar: {
    color: "#ff0000"
  },
  main: {
    padding: 30
  },
  table: {
    textAlign: 'left',
    color: ONE_BLACK,
    marginTop: 10,
    marginBottom: 30,
    borderSpacing: 0,
    borderCollapse: "collapse",
    minWidth: 800,
    "& td": {
      padding: 10,
      borderBottom: `1px solid ${ONE_GRAY}`
    },
    "& th": {
      padding: 10,
      borderBottom: `1px solid ${ONE_GRAY}`
    },
    "& tr": {
    }
  }
};

class App extends Component {
  constructor() {
    super();

    this.state = {
      value: '( SELECT ( SELECT ( SELECT "storeId" FROM "public"."DistributionChannelInStore" "dcis" WHERE "dcis"."id" = "o"."distributionChannelInStoreId") FROM "public"."Order" "o" WHERE "o"."id" = "oi"."orderId") FROM "public"."OrderItem" "oi" WHERE "oi"."id" = {currentUserIdOrNull} )'
    };
  }
  onChange(value) {
    this.setState({
      value
    });
  }
  format() {
    const value = sqlFormatter.format(this.state.value, {
      language: "sql", // Defaults to "sql"
      indent: "  "   // Defaults to two spaces
    });

    this.setState({
      value
    });
  }
  render() {
    const { styles } = this.props;
    return (
      <div>
        <Header></Header>
        <PathList></PathList>
        <div className={ styles.main }>
          <Section title="General">
            <Label label="Schemas"></Label>
            <MultiSelect></MultiSelect>
            {/*<div>
            <Input></Input><Button label="Add"></Button>
            </div>*/}
            <Label label="View Schema"></Label>
            <Input></Input>
          </Section>
          <Section title="Tables" color={"#FFEB00"}>
            <table className={ styles.table }>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>SCHEMA</th>
                <th>ACTIONS</th>
              </tr>
              <tr>
                <td>57afcca1-37b2-4c5e-8f6e-6bab43500001</td>
                <td>User</td>
                <td>one_example</td>
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
              <tr>
                <td>37afcca1-37b2-4c5e-8f6e-6bab43500001</td>
                <td>Post</td>
                <td>one_example</td>
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
              <tr>
                <td>67afcca1-37b2-4c5e-8f6e-6bab43500001</td>
                <td>Comment</td>
                <td>one_example</td>
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
            </table>
            <Button label="Create new table" />
          </Section>
          <Section title="Expressions" color={"#FF2894"}>
            <table className={ styles.table }>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>GQL-RETURN-TYPE</th>
                <th>PLACEHOLDERS</th>
                <th>AUTH-REQUIRED</th>
                {/* <th>NAME-TEMPLATE</th>
                <th>SQL-TEMPLATE</th> */}
                <th>ACTIONS</th>
              </tr>
              <tr>
                <td>17afcca1-37b2-4c5e-7f6e-6bab43500003</td>
                <td>Anyone</td>
                <td>String</td>
                <td>-</td>
                <td>FALSE</td>
                {/* <td>Anyone</td>
                <td>TRUE</td> */}
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
              <tr>
                <td>17afcca1-37b2-4c5e-7f6e-6bab43500004</td>
                <td>currentUserIdOrNull</td>
                <td>String</td>
                <td>-</td>
                <td>TRUE</td>
                {/* <td>currentUserIdOrNull</td>
                <td>_auth.current_user_id_or_null()</td> */}
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
              <tr>
                <td>17afcca1-37b2-4c5e-7f6e-6bab43500002</td>
                <td>Owner</td>
                <td>Boolean</td>
                <td>-</td>
                <td>INHERIT</td>
                {/* <td>{"Owner_${column.columnName}"}</td>
                <td>{"${currentUserIdOrNull} = ${column.columnSelector} AND ${currentUserIdOrNull} IS NOT NULL"}</td> */}
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
            </table>
            <Button label="Create new expression" />
          </Section>
          <Section title="Input-Placeholders" color={"#FF9900"}>
            <table className={ styles.table }>
              <tr>
                <th>KEY</th>
                <th>TYPE</th>
                <th>ACTIONS</th>
              </tr>
              <tr>
                <td>column</td>
                <td>LOCAL_COLUMN</td>
                <td><Button label="Remove" /></td>
              </tr>
            </table>
            <Label label="Key"></Label>
            <Input></Input>
            <Label label="Type"></Label>
            <Select options={[{key: "LOCAL_COLUMN", value: "LOCAL COLUMN"},{key: "FOREIGN_COLUMN", value: "FOREIGN COLUMN"},{key: "FOREIGN_TABLE", value: "FOREIGN TABLE"}]} />
            <br/><br/>
            <Button label="Add new Input-Placeholder" />
          </Section>
          <Section title="Static-Placeholders" color={"#00D2FF"}>
            <table className={ styles.table }>
              <tr>
                <th>KEY</th>
                <th>TYPE</th>
                <th>VALUE</th>
                <th>ACTIONS</th>
              </tr>
              <tr>
                <td>foreigncolumn</td>
                <td>FOREIGN_COLUMN</td>
                <td>"Post"."id"</td>
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
            </table>
            <Label label="Key"></Label>
            <Input></Input>
            <Label label="Type"></Label>
            <Select options={[{key: "LOCAL_COLUMN", value: "LOCAL COLUMN"},{key: "FOREIGN_COLUMN", value: "FOREIGN COLUMN"},{key: "FOREIGN_TABLE", value: "FOREIGN TABLE"}]} />
            <Label label="Value"></Label>
            <Select options={[{key: "a", value: "Post.id"},{key: "b", value: "Post.title"},{key: "c", value: "Post.foobar"}]} />
            <br/><br/>
            <Button label="Create new Static-Placeholder" />
          </Section>
          <Section title="Expression-Placeholders" color={"#FF2894"}>
            <table className={ styles.table }>
              <tr>
                <th>KEY</th>
                <th>EXPRESSION</th>
                <th>PARAMS</th>
                <th>ACTIONS</th>
              </tr>
              <tr>
                <td>column</td>
                <td>currentUserIdOrNull</td>
                <td>-</td>
                <td><Button label="Edit" />&nbsp;&nbsp;<Button label="Remove" /></td>
              </tr>
            </table>
            <Label label="Key"></Label>
            <Input></Input>
            <Label label="Expression"></Label>
            <Select options={[{key: "a", value: "Anyone"},{key: "b", value: "Owner"},{key: "c", value: "IndirectOwner"}]} />
            <Section title="Params" color={"#FF2894"}>
              <Label label="column"></Label>
              <Select options={[{key: "a", value: "Post.id"},{key: "b", value: "Post.title"},{key: "c", value: "Post.foobar"}]} />
            </Section>
            <Button label="Create new Expression-Placeholder" />
          </Section>
          <Section title="General" color={"#cccccc"}>
            <Label label="Name"></Label>
            <Input></Input>
            <Label label="Name-Template"></Label>
            <Input></Input>
            <Label label="SQL-Template"></Label>
            <AceEditor
              mode="pgsql"
              theme="github"
              value={this.state.value}
              onChange={this.onChange.bind(this)}
              name="UNIQUE_ID_OF_DIV"
              editorProps={{ $blockScrolling: true }}
            />
            <br/>
            <Button label="Format" onClick={ this.format.bind(this) } />
            <Label label="Local Table"></Label>
            <Select options={[{key: "a", value: "NONE"},{key: "b", value: "User"},{key: "c", value: "Post"}]} />
            <Label label="Auth required"></Label>
            <Select options={[{key: "a", value: "INHERIT"},{key: "b", value: "TRUE"},{key: "c", value: "FALSE"}]} />
            <br/><br/><Button label="Create new Expression-Placeholder" />
          </Section>
          
        </div>
      </div>
    );
  }
}

export default connect(style)(App);